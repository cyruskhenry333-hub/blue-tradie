import OpenAI from 'openai';
import { randomUUID } from 'crypto';
import { db } from '../db';
import { aiResponses, tokenUsage, users, type User } from '../../shared/schema';
import { eq, and, desc } from 'drizzle-orm';
import { tokenLedgerService } from './tokenLedgerService';

// Feature flag: Disable token ledger for debugging/testing
// Set DISABLE_TOKEN_LEDGER=true to bypass token provisioning/reconciliation
const DISABLE_TOKEN_LEDGER = process.env.DISABLE_TOKEN_LEDGER === 'true';

// Log feature flag status at startup
if (DISABLE_TOKEN_LEDGER) {
  console.warn('[AIService] ⚠️  Token ledger is DISABLED (DISABLE_TOKEN_LEDGER=true) - AI calls will bypass token accounting');
} else {
  console.log('[AIService] Token ledger is ENABLED - AI calls will be tracked and limited');
}

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
    agentType: 'accountant' | 'marketer' | 'business_coach' | 'legal' | 'operations' | 'technology' = 'business_coach',
    requestId?: string,
    abortSignal?: AbortSignal
  ): Promise<AIResponse> {
    const reqId = requestId || randomUUID();
    const startTime = Date.now();

    console.log(`[AIService ${reqId}] chat() START - userId=${userId}, agent=${agentType}, messagesCount=${messages.length}`);

    const userMessage = messages[messages.length - 1]?.content;
    if (!userMessage) {
      throw new Error('No user message provided');
    }

    // Step 1: Check cached responses first (free, no token cost)
    console.log(`[AIService ${reqId}] Step 1: Checking cache...`);
    const cacheStartTime = Date.now();
    const cachedResponse = await this.findCachedResponse(userMessage, agentType, reqId);
    console.log(`[AIService ${reqId}] Step 1: Cache check complete - took ${Date.now() - cacheStartTime}ms, hit=${!!cachedResponse}`);

    if (cachedResponse) {
      console.log(`[AIService ${reqId}] Returning cached response - total duration ${Date.now() - startTime}ms`);
      return {
        content: cachedResponse.response,
        tokens_used: 0,
        cost_aud: 0,
        source: 'cached'
      };
    }

    // Step 2: Provision tokens (pessimistic lock)
    // Skip if DISABLE_TOKEN_LEDGER feature flag is enabled
    let provision: { provisionId: number; transactionId: string; balanceAfter: number } | null = null;

    if (DISABLE_TOKEN_LEDGER) {
      console.log(`[AIService ${reqId}] Step 2: SKIPPED (DISABLE_TOKEN_LEDGER=true) - Token ledger disabled`);
    } else {
      console.log(`[AIService ${reqId}] Step 2: Provisioning tokens (estimated: 150)...`);
      const estimatedTokens = 150; // Reasonable estimate for gpt-4o-mini with max_tokens=200

      try {
        const provisionStartTime = Date.now();
        provision = await tokenLedgerService.provisionTokens(userId, estimatedTokens, {
          advisor: agentType,
        }, reqId);
        console.log(`[AIService ${reqId}] Step 2: Tokens provisioned - took ${Date.now() - provisionStartTime}ms, provisionId=${provision.provisionId}`);
      } catch (error: any) {
        console.error(`[AIService ${reqId}] Step 2: Provision failed - ${error.message}`);
        // Insufficient balance
        throw new Error(error.message || 'Unable to provision tokens. Please check your balance.');
      }
    }

    // Step 3: Call OpenAI API (wrapped in try/catch for rollback)
    let aiResponse;
    try {
      console.log(`[AIService ${reqId}] Step 3: Calling OpenAI API...`);
      const openaiStartTime = Date.now();
      aiResponse = await this.callOpenAI(messages, agentType, reqId, abortSignal);
      console.log(`[AIService ${reqId}] Step 3: OpenAI call complete - took ${Date.now() - openaiStartTime}ms, tokens=${aiResponse.tokens_used}`);

      // Step 4: Reconcile with actual usage
      if (DISABLE_TOKEN_LEDGER || !provision) {
        console.log(`[AIService ${reqId}] Step 4: SKIPPED (token ledger disabled or no provision)`);
      } else {
        console.log(`[AIService ${reqId}] Step 4: Reconciling tokens...`);
        const reconcileStartTime = Date.now();
        await tokenLedgerService.reconcileTokens(
          provision.provisionId,
          provision.transactionId,
          aiResponse.tokens_used,
          {
            model: 'gpt-4o-mini',
            promptTokens: aiResponse.tokens_used, // Simplified - you can track prompt/completion separately
            completionTokens: 0,
          },
          reqId
        );
        console.log(`[AIService ${reqId}] Step 4: Reconciliation complete - took ${Date.now() - reconcileStartTime}ms`);
      }

      // Step 5: Save response to cache for future use
      console.log(`[AIService ${reqId}] Step 5: Caching response...`);
      const cacheWriteStartTime = Date.now();
      await this.cacheResponse(userMessage, aiResponse.content, agentType, reqId);
      console.log(`[AIService ${reqId}] Step 5: Cache write complete - took ${Date.now() - cacheWriteStartTime}ms`);

      console.log(`[AIService ${reqId}] chat() SUCCESS - total duration ${Date.now() - startTime}ms`);
      return aiResponse;

    } catch (error: any) {
      console.error(`[AIService ${reqId}] ERROR in OpenAI call: ${error.message}`);

      // Step 6: Rollback provision on error (only if token ledger is enabled)
      if (DISABLE_TOKEN_LEDGER || !provision) {
        console.log(`[AIService ${reqId}] Step 6: SKIPPED (token ledger disabled or no provision to rollback)`);
      } else {
        console.log(`[AIService ${reqId}] Step 6: Rolling back provision...`);
        const rollbackStartTime = Date.now();
        await tokenLedgerService.rollbackProvision(
          provision.provisionId,
          provision.transactionId,
          error.message || 'OpenAI API call failed',
          reqId
        );
        console.log(`[AIService ${reqId}] Step 6: Rollback complete - took ${Date.now() - rollbackStartTime}ms`);
      }

      throw new Error(DISABLE_TOKEN_LEDGER
        ? 'Failed to generate AI response. Please try again.'
        : 'Failed to generate AI response. Your tokens have been refunded. Please try again.');
    }
  }

  /**
   * Check cached responses with semantic similarity
   */
  private async findCachedResponse(query: string, agentType: string, requestId: string) {
    try {
      console.log(`[AIService ${requestId}] findCachedResponse: Querying DB for cached responses...`);
      const dbStartTime = Date.now();

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

      console.log(`[AIService ${requestId}] findCachedResponse: DB query complete - took ${Date.now() - dbStartTime}ms, found ${cached.length} cached responses`);

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
    } catch (error: any) {
      // Defensive: if ai_responses table doesn't exist (42P01), treat as cache miss
      if (error?.code === '42P01') {
        console.warn('[AIService] ai_responses table does not exist - treating as cache miss. Run migrations to create table.');
        return null;
      }
      console.error('Error finding cached response:', error);
      return null;
    }
  }

  /**
   * Call OpenAI API with agent-specific system prompts
   */
  private async callOpenAI(messages: ChatMessage[], agentType: string, requestId: string, abortSignal?: AbortSignal): Promise<AIResponse> {
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
      console.log(`[AIService ${requestId}] callOpenAI: Sending request to OpenAI API...`);
      const apiStartTime = Date.now();

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using GPT-4o-mini for cost efficiency
        messages: [systemMessage, ...messages],
        max_tokens: 200, // Shorter, more focused responses
        temperature: 0.8, // More personality and natural flow
      }, {
        signal: abortSignal, // Pass abort signal to cancel on timeout
      });

      console.log(`[AIService ${requestId}] callOpenAI: Received response from OpenAI - took ${Date.now() - apiStartTime}ms`);

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

      console.log(`[AIService ${requestId}] callOpenAI: Response processed - tokens=${tokensUsed}, cost=${costAud.toFixed(6)} AUD`);

      return {
        content: response,
        tokens_used: tokensUsed,
        cost_aud: costAud,
        source: 'openai'
      };

    } catch (error: any) {
      console.error(`[AIService ${requestId}] callOpenAI: OpenAI API error - ${error.message}`);
      console.error(`[AIService ${requestId}] callOpenAI: Error details:`, error);
      throw new Error('Failed to generate AI response. Please try again.');
    }
  }

  /**
   * Cache AI response for future use
   */
  private async cacheResponse(query: string, response: string, agentType: string, requestId: string) {
    try {
      console.log(`[AIService ${requestId}] cacheResponse: Inserting response into cache...`);
      const dbStartTime = Date.now();

      await db.insert(aiResponses).values({
        query: query.trim(),
        response: response.trim(),
        agentType,
        isActive: true,
        createdAt: new Date(),
      });

      console.log(`[AIService ${requestId}] cacheResponse: Cache insert complete - took ${Date.now() - dbStartTime}ms`);
    } catch (error: any) {
      console.error(`[AIService ${requestId}] cacheResponse: Error caching response - ${error.message}`);
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