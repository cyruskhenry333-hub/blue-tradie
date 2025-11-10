import OpenAI from 'openai';
import { db } from '../db';
import { aiResponses, tokenUsage, users, type User } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { tokenLedgerService } from './tokenLedgerService';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Token allocation limits per tier
const TOKEN_LIMITS = {
  demo: 1000000, // 1M tokens for 14-day demo trial
  'Blue Lite': 10000,
  'Blue Core': 25000,
  'Blue Teams': 50000,
};

interface AIResponse {
  content: string;
  tokens_used: number;
  cost_aud: number;
  source: 'cached' | 'openai';
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export class AIService {
  
  /**
   * Main chat method - implements hybrid fallback system with ledger-based token tracking
   */
  async chat(
    userId: string,
    messages: ChatMessage[],
    agentType: 'accountant' | 'marketer' | 'business_coach' | 'legal' | 'operations' | 'technology' = 'business_coach'
  ): Promise<AIResponse> {

    const userMessage = messages[messages.length - 1]?.content;
    if (!userMessage) {
      throw new Error('No user message provided');
    }

    // Step 1: Check cached responses first (free, no token cost)
    const cachedResponse = await this.findCachedResponse(userMessage, agentType);
    if (cachedResponse) {
      return {
        content: cachedResponse.response,
        tokens_used: 0,
        cost_aud: 0,
        source: 'cached'
      };
    }

    // Step 2: Provision tokens (pessimistic lock)
    const estimatedTokens = 150; // Reasonable estimate for gpt-4o-mini with max_tokens=200
    let provision;

    try {
      provision = await tokenLedgerService.provisionTokens(userId, estimatedTokens, {
        advisor: agentType,
      });
    } catch (error: any) {
      // Insufficient balance
      throw new Error(error.message || 'Unable to provision tokens. Please check your balance.');
    }

    // Step 3: Call OpenAI API (wrapped in try/catch for rollback)
    let aiResponse;
    try {
      aiResponse = await this.callOpenAI(messages, agentType);

      // Step 4: Reconcile with actual usage
      await tokenLedgerService.reconcileTokens(
        provision.provisionId,
        provision.transactionId,
        aiResponse.tokens_used,
        {
          model: 'gpt-4o-mini',
          promptTokens: aiResponse.tokens_used, // Simplified - you can track prompt/completion separately
          completionTokens: 0,
        }
      );

      // Step 5: Save response to cache for future use
      await this.cacheResponse(userMessage, aiResponse.content, agentType);

      return aiResponse;

    } catch (error: any) {
      // Step 6: Rollback provision on error
      await tokenLedgerService.rollbackProvision(
        provision.provisionId,
        provision.transactionId,
        error.message || 'OpenAI API call failed'
      );

      throw new Error('Failed to generate AI response. Your tokens have been refunded. Please try again.');
    }
  }

  /**
   * Check cached responses with semantic similarity
   */
  private async findCachedResponse(query: string, agentType: string) {
    try {
      // Simple keyword matching for now - can be enhanced with embedding similarity
      const keywords = query.toLowerCase().split(' ').filter(word => word.length > 3);
      
      const cached = await db
        .select()
        .from(aiResponses)
        .where(
          and(
            eq(aiResponses.agentType, agentType),
            eq(aiResponses.isActive, true)
          )
        )
        .orderBy(desc(aiResponses.createdAt))
        .limit(50);

      // Find best match based on keyword overlap
      let bestMatch = null;
      let highestScore = 0;

      for (const response of cached) {
        const responseKeywords = response.query.toLowerCase().split(' ');
        const matchCount = keywords.filter(keyword => 
          responseKeywords.some(rw => rw.includes(keyword))
        ).length;
        
        const score = matchCount / keywords.length;
        if (score > 0.6 && score > highestScore) { // 60% similarity threshold
          highestScore = score;
          bestMatch = response;
        }
      }

      return bestMatch;
    } catch (error) {
      console.error('Error finding cached response:', error);
      return null;
    }
  }

  /**
   * Call OpenAI API with agent-specific system prompts
   */
  private async callOpenAI(messages: ChatMessage[], agentType: string): Promise<AIResponse> {
    const systemPrompts = {
      accountant: "You are Blue Tradie's AI Accountant 📊 Direct, practical, focused on AU/NZ tax law. Keep responses SHORT and actionable. NO asterisks. Always end with a clear next step or question. Be helpful, not lecture-heavy.",
      
      marketer: "You are Blue Tradie's AI Marketing specialist 📢 Enthusiastic, creative, understand tradies. Keep responses SHORT and practical. NO asterisks. Use emojis naturally. Always end with ONE actionable tip or question. Be energetic but concise.",
      
      business_coach: "You are Blue Tradie's AI Business Coach 🚀 You're energetic, practical, and understand the tradie lifestyle! Keep responses SHORT (1-2 sentences max), friendly, and action-focused. Use emojis naturally but sparingly. NO asterisks for emphasis. Always end with ONE clear question or next step. Be conversational, not content-heavy.",
      
      legal: "You are Blue Tradie's AI Legal advisor ⚖️ Careful, thorough, AU/NZ business law focused. Keep responses SHORT and clear. NO asterisks. Always end with a clear next step. Recommend lawyer consultation when needed. Be helpful, not overwhelming."
    };

    const systemMessage: ChatMessage = {
      role: 'system',
      content: systemPrompts[agentType as keyof typeof systemPrompts] || systemPrompts.business_coach
    };

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using GPT-4o-mini for cost efficiency
        messages: [systemMessage, ...messages],
        max_tokens: 200, // Shorter, more focused responses
        temperature: 0.8, // More personality and natural flow
      });

      let response = completion.choices[0]?.message?.content || '';
      
      // Clean up response: remove excessive asterisks and formatting issues
      response = response
        .replace(/\*{2,}/g, '') // Remove multiple asterisks
        .replace(/\*([^*]+)\*/g, '$1') // Remove single asterisk emphasis 
        .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
        .trim();
      
      const tokensUsed = completion.usage?.total_tokens || 0;
      
      // Calculate cost in AUD (GPT-4o-mini: ~$0.60 per 1M tokens + 20% markup)
      const costUsd = (tokensUsed / 1000000) * 0.60;
      const costAud = costUsd * 1.52 * 1.20; // USD to AUD with 20% markup

      return {
        content: response,
        tokens_used: tokensUsed,
        cost_aud: costAud,
        source: 'openai'
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('Failed to generate AI response. Please try again.');
    }
  }

  /**
   * Cache AI response for future use
   */
  private async cacheResponse(query: string, response: string, agentType: string) {
    try {
      await db.insert(aiResponses).values({
        query: query.trim(),
        response: response.trim(),
        agentType,
        isActive: true,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error caching response:', error);
      // Don't throw - caching failure shouldn't break the user experience
    }
  }

  /**
   * Track token usage and update user balance
   */
  private async trackTokenUsage(userId: string, tokensUsed: number, costAud: number) {
    try {
      // Record usage
      await db.insert(tokenUsage).values({
        userId,
        tokensUsed,
        costAud: costAud.toString(),
        timestamp: new Date(),
      });

      // Update user token balance
      const user = await this.getUserWithTokenBalance(userId);
      const newBalance = Math.max(0, user.tokenBalance - tokensUsed);
      
      // Update user's token balance (this would need to be added to the users table)
      // For now, we'll track usage separately and calculate balance on demand
      
    } catch (error) {
      console.error('Error tracking token usage:', error);
      // Don't throw - usage tracking failure shouldn't break the user experience
    }
  }

  /**
   * Get user with current token balance
   */
  private async getUserWithTokenBalance(userId: string): Promise<User & { tokenBalance: number }> {
    // Get user info
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      throw new Error('User not found');
    }

    // For demo users, use their specific demo token limit
    if (user.isDemoUser) {
      const demoTokensUsed = user.demoTokensUsed || 0;
      const demoTokenLimit = user.demoTokenLimit || 1000000;
      const tokenBalance = Math.max(0, demoTokenLimit - demoTokensUsed);
      
      return {
        ...user,
        tokenBalance
      };
    }

    // For regular users, calculate monthly usage
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyUsage = await db
      .select()
      .from(tokenUsage)
      .where(eq(tokenUsage.userId, userId));

    const totalUsed = monthlyUsage.reduce((sum, usage) => sum + usage.tokensUsed, 0);
    const tierKey = (user.subscriptionTier || 'demo') as keyof typeof TOKEN_LIMITS;
    const monthlyLimit = TOKEN_LIMITS[tierKey] || TOKEN_LIMITS.demo;
    const tokenBalance = Math.max(0, monthlyLimit - totalUsed);

    return {
      ...user,
      tokenBalance
    };
  }

  /**
   * Get user's token usage statistics
   */
  async getTokenStats(userId: string) {
    const user = await this.getUserWithTokenBalance(userId);
    
    // For demo users, use demo-specific stats
    if (user.isDemoUser) {
      const demoTokensUsed = user.demoTokensUsed || 0;
      const demoTokenLimit = user.demoTokenLimit || 1000000;
      const tokensRemaining = Math.max(0, demoTokenLimit - demoTokensUsed);
      
      return {
        monthlyLimit: demoTokenLimit,
        tokensUsed: demoTokensUsed,
        tokensRemaining,
        totalCostAud: 0, // Demo users don't pay
        usagePercentage: (demoTokensUsed / demoTokenLimit) * 100,
      };
    }
    
    // For regular users, calculate monthly usage
    const tierKey = (user.subscriptionTier || 'demo') as keyof typeof TOKEN_LIMITS;
    const monthlyLimit = TOKEN_LIMITS[tierKey] || TOKEN_LIMITS.demo;
    
    const currentMonth = new Date();
    currentMonth.setDate(1);
    
    const monthlyUsage = await db
      .select()
      .from(tokenUsage)
      .where(eq(tokenUsage.userId, userId));

    const totalUsed = monthlyUsage.reduce((sum, usage) => sum + usage.tokensUsed, 0);
    const totalCost = monthlyUsage.reduce((sum, usage) => sum + parseFloat(usage.costAud), 0);

    return {
      monthlyLimit,
      tokensUsed: totalUsed,
      tokensRemaining: Math.max(0, monthlyLimit - totalUsed),
      totalCostAud: totalCost,
      usagePercentage: (totalUsed / monthlyLimit) * 100,
    };
  }
}

export const aiService = new AIService();