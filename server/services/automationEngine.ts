import { db } from "@db";
import {
  automationRules,
  automationExecutions,
  reviewRequests,
  jobs,
  invoices,
  quotes,
  users,
  type AutomationRule,
  type InsertAutomationExecution,
  type InsertReviewRequest,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { emailServiceWrapper } from "./email-service-wrapper";
import { automationQueue } from "./queueService";
import crypto from "crypto";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface TriggerContext {
  userId: string;
  jobId?: number;
  invoiceId?: number;
  quoteId?: number;
  customerName?: string;
  customerEmail?: string;
  amount?: string;
  jobTitle?: string;
  [key: string]: any;
}

export class AutomationEngine {
  /**
   * Process a trigger event and execute matching automation rules
   */
  async processTrigger(
    triggerType: string,
    context: TriggerContext
  ): Promise<void> {
    try {
      // Find active automation rules for this trigger
      const rules = await db
        .select()
        .from(automationRules)
        .where(
          and(
            eq(automationRules.userId, context.userId),
            eq(automationRules.triggerType, triggerType),
            eq(automationRules.isActive, true)
          )
        );

      for (const rule of rules) {
        // Check if trigger conditions are met
        if (this.checkTriggerConditions(rule, context)) {
          // Calculate execution time based on delay
          const executionDelay = this.calculateDelay(rule);

          if (executionDelay === 0) {
            // Execute immediately
            await this.executeRule(rule, context);
          } else {
            // Schedule for later execution (would integrate with a job queue in production)
            await this.scheduleExecution(rule, context, executionDelay);
          }
        }
      }
    } catch (error) {
      console.error('Error processing trigger:', error);
      throw error;
    }
  }

  /**
   * Check if trigger conditions match the context
   */
  private checkTriggerConditions(
    rule: AutomationRule,
    context: TriggerContext
  ): boolean {
    if (!rule.triggerConditions) {
      return true; // No conditions means always execute
    }

    const conditions = rule.triggerConditions as Record<string, any>;

    // Check each condition
    for (const [key, expectedValue] of Object.entries(conditions)) {
      const actualValue = context[key];

      // Simple equality check (can be extended for more complex conditions)
      if (actualValue !== expectedValue) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate delay in milliseconds
   */
  private calculateDelay(rule: AutomationRule): number {
    const days = rule.delayDays || 0;
    const hours = rule.delayHours || 0;
    return (days * 24 * 60 * 60 * 1000) + (hours * 60 * 60 * 1000);
  }

  /**
   * Schedule a rule execution for later using Bull queue
   */
  private async scheduleExecution(
    rule: AutomationRule,
    context: TriggerContext,
    delayMs: number
  ): Promise<void> {
    // Add job to Bull queue with delay
    await automationQueue.add(
      {
        ruleId: rule.id,
        context,
      },
      {
        delay: delayMs,
        jobId: `automation-${rule.id}-${Date.now()}`,
      }
    );

    console.log(`[AutomationEngine] Scheduled rule ${rule.id} to execute in ${delayMs}ms`);
  }

  /**
   * Execute an automation rule
   */
  async executeRule(
    rule: AutomationRule,
    context: TriggerContext
  ): Promise<void> {
    const executionId = await this.logExecutionStart(rule.id, context);

    try {
      let content: string;
      let tokensUsed = 0;

      // Generate content using AI or use static content
      if (rule.useAI && rule.aiPrompt) {
        const aiResult = await this.generateAIContent(rule, context);
        content = aiResult.content;
        tokensUsed = aiResult.tokensUsed;
      } else {
        content = this.replaceVariables(rule.staticContent || "", context);
      }

      // Perform the action
      await this.performAction(rule, context, content);

      // Log successful execution
      await this.logExecutionSuccess(executionId, content, tokensUsed);

      // Update rule statistics
      await this.updateRuleStats(rule.id, true);
    } catch (error) {
      console.error('Error executing rule:', error);
      await this.logExecutionFailure(executionId, error instanceof Error ? error.message : 'Unknown error');
      await this.updateRuleStats(rule.id, false);
      throw error;
    }
  }

  /**
   * Generate content using AI
   */
  private async generateAIContent(
    rule: AutomationRule,
    context: TriggerContext
  ): Promise<{ content: string; tokensUsed: number }> {
    try {
      // Build context-aware prompt
      const systemPrompt = `You are a helpful assistant for a tradesperson using Blue Tradie.
Generate professional, friendly, and personalized messages based on the following context:

Customer Name: ${context.customerName || 'valued customer'}
Job: ${context.jobTitle || 'recent work'}
Business: ${context.businessName || 'their business'}

The message should be warm, professional, and appropriate for the Australian trades industry.
Keep it concise and natural - no more than 2-3 sentences.`;

      const userPrompt = this.replaceVariables(rule.aiPrompt || "", context);

      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: userPrompt
        }],
        system: systemPrompt,
      });

      const content = message.content[0].type === 'text'
        ? message.content[0].text
        : '';

      // Calculate approximate token usage
      const tokensUsed = (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0);

      return { content, tokensUsed };
    } catch (error) {
      console.error('Error generating AI content:', error);
      // Fallback to static content if AI fails
      return {
        content: this.replaceVariables(rule.staticContent || "", context),
        tokensUsed: 0
      };
    }
  }

  /**
   * Replace variables in content with context values
   */
  private replaceVariables(content: string, context: TriggerContext): string {
    let result = content;

    // Replace all {{variable}} placeholders
    const variables = {
      customerName: context.customerName || 'valued customer',
      jobTitle: context.jobTitle || 'your recent job',
      amount: context.amount || '',
      businessName: context.businessName || 'our business',
      invoiceNumber: context.invoiceNumber || '',
      quoteNumber: context.quoteNumber || '',
    };

    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    return result;
  }

  /**
   * Perform the configured action
   */
  private async performAction(
    rule: AutomationRule,
    context: TriggerContext,
    content: string
  ): Promise<void> {
    const config = rule.actionConfig as Record<string, any> || {};

    switch (rule.actionType) {
      case 'send_email':
        await this.sendEmail(context, content, config);
        break;

      case 'send_sms':
        await this.sendSMS(context, content, config);
        break;

      case 'request_review':
        await this.createReviewRequest(context, content, config);
        break;

      case 'create_task':
        // Future: Create a task in the logbook or calendar
        console.log('Create task action not yet implemented');
        break;

      default:
        throw new Error(`Unknown action type: ${rule.actionType}`);
    }
  }

  /**
   * Send email action
   */
  private async sendEmail(
    context: TriggerContext,
    content: string,
    config: Record<string, any>
  ): Promise<void> {
    if (!context.customerEmail) {
      throw new Error('Customer email not provided');
    }

    const subject = config.subject || 'Message from your tradie';

    await emailServiceWrapper.sendEmail({
      to: context.customerEmail,
      subject,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p style="white-space: pre-wrap;">${content.replace(/\n/g, '<br>')}</p>
      </div>`
    });
  }

  /**
   * Send SMS action (placeholder - would integrate with Twilio/MessageBird)
   */
  private async sendSMS(
    context: TriggerContext,
    content: string,
    config: Record<string, any>
  ): Promise<void> {
    // TODO: Integrate with SMS provider
    console.log('SMS sending not yet implemented', {
      to: context.customerPhone,
      message: content,
    });
  }

  /**
   * Create a review request
   */
  private async createReviewRequest(
    context: TriggerContext,
    content: string,
    config: Record<string, any>
  ): Promise<void> {
    if (!context.customerEmail) {
      throw new Error('Customer email not provided');
    }

    // Generate unique review token
    const token = crypto.randomBytes(32).toString('hex');

    // Create review request record
    const [reviewRequest] = await db.insert(reviewRequests).values({
      userId: context.userId,
      jobId: context.jobId,
      customerName: context.customerName || 'Customer',
      customerEmail: context.customerEmail,
      requestType: config.reviewType || 'google_review',
      status: 'sent',
      token,
      sentAt: new Date(),
    }).returning();

    // Build review link
    const appUrl = process.env.APP_BASE_URL || 'https://bluetradie.com';
    const reviewLink = `${appUrl}/review/${token}`;

    // Send review request email
    const emailContent = `
Hi ${context.customerName || 'there'},

${content}

We'd really appreciate if you could leave us a review:
${reviewLink}

Thanks for your time!
    `.trim();

    await emailServiceWrapper.sendEmail({
      to: context.customerEmail,
      subject: config.subject || 'Could you leave us a review?',
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>Hi ${context.customerName || 'there'},</p>
        <p style="white-space: pre-wrap;">${content.replace(/\n/g, '<br>')}</p>
        <p>We'd really appreciate if you could leave us a review:</p>
        <p style="text-align: center; margin: 20px 0;">
          <a href="${reviewLink}"
             style="background-color: #4F46E5; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 6px; display: inline-block;">
            Leave a Review
          </a>
        </p>
        <p>Thanks for your time!</p>
      </div>`
    });
  }

  /**
   * Log the start of an execution
   */
  private async logExecutionStart(
    ruleId: number,
    context: TriggerContext
  ): Promise<number> {
    const [execution] = await db.insert(automationExecutions).values({
      ruleId,
      status: 'pending',
      triggerContext: context as any,
    }).returning();

    return execution.id;
  }

  /**
   * Log successful execution
   */
  private async logExecutionSuccess(
    executionId: number,
    content: string,
    tokensUsed: number
  ): Promise<void> {
    await db.update(automationExecutions)
      .set({
        status: 'success',
        generatedContent: content,
        aiTokensUsed: tokensUsed,
        executedAt: new Date(),
      })
      .where(eq(automationExecutions.id, executionId));
  }

  /**
   * Log failed execution
   */
  private async logExecutionFailure(
    executionId: number,
    error: string
  ): Promise<void> {
    await db.update(automationExecutions)
      .set({
        status: 'failed',
        errorMessage: error,
        executedAt: new Date(),
      })
      .where(eq(automationExecutions.id, executionId));
  }

  /**
   * Update rule execution statistics
   */
  private async updateRuleStats(
    ruleId: number,
    success: boolean
  ): Promise<void> {
    await db.update(automationRules)
      .set({
        executionCount: sql`${automationRules.executionCount} + 1`,
        successCount: success ? sql`${automationRules.successCount} + 1` : automationRules.successCount,
        failureCount: !success ? sql`${automationRules.failureCount} + 1` : automationRules.failureCount,
        lastExecutedAt: new Date(),
      })
      .where(eq(automationRules.id, ruleId));
  }

  /**
   * Get automation rules for a user
   */
  async getRules(userId: string): Promise<AutomationRule[]> {
    return await db
      .select()
      .from(automationRules)
      .where(eq(automationRules.userId, userId))
      .orderBy(desc(automationRules.createdAt));
  }

  /**
   * Get a specific rule
   */
  async getRule(ruleId: number, userId: string): Promise<AutomationRule | null> {
    const [rule] = await db
      .select()
      .from(automationRules)
      .where(
        and(
          eq(automationRules.id, ruleId),
          eq(automationRules.userId, userId)
        )
      )
      .limit(1);

    return rule || null;
  }

  /**
   * Create a new automation rule
   */
  async createRule(
    userId: string,
    data: {
      name: string;
      description?: string;
      triggerType: string;
      triggerConditions?: Record<string, any>;
      delayDays?: number;
      delayHours?: number;
      actionType: string;
      actionConfig?: Record<string, any>;
      useAI?: boolean;
      aiPrompt?: string;
      staticContent?: string;
    }
  ): Promise<AutomationRule> {
    const [rule] = await db.insert(automationRules).values({
      userId,
      ...data,
      isActive: true,
    }).returning();

    return rule;
  }

  /**
   * Update an automation rule
   */
  async updateRule(
    ruleId: number,
    userId: string,
    updates: Partial<AutomationRule>
  ): Promise<AutomationRule> {
    const [updatedRule] = await db
      .update(automationRules)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(automationRules.id, ruleId),
          eq(automationRules.userId, userId)
        )
      )
      .returning();

    if (!updatedRule) {
      throw new Error('Rule not found');
    }

    return updatedRule;
  }

  /**
   * Delete an automation rule
   */
  async deleteRule(ruleId: number, userId: string): Promise<void> {
    await db
      .delete(automationRules)
      .where(
        and(
          eq(automationRules.id, ruleId),
          eq(automationRules.userId, userId)
        )
      );
  }

  /**
   * Toggle rule active status
   */
  async toggleRule(ruleId: number, userId: string, isActive: boolean): Promise<AutomationRule> {
    const [rule] = await db
      .update(automationRules)
      .set({ isActive })
      .where(
        and(
          eq(automationRules.id, ruleId),
          eq(automationRules.userId, userId)
        )
      )
      .returning();

    if (!rule) {
      throw new Error('Rule not found');
    }

    return rule;
  }

  /**
   * Get execution history for a rule
   */
  async getExecutionHistory(
    ruleId: number,
    userId: string,
    limit = 50
  ): Promise<any[]> {
    // Verify rule belongs to user
    const rule = await this.getRule(ruleId, userId);
    if (!rule) {
      throw new Error('Rule not found');
    }

    return await db
      .select()
      .from(automationExecutions)
      .where(eq(automationExecutions.ruleId, ruleId))
      .orderBy(desc(automationExecutions.executedAt))
      .limit(limit);
  }

  /**
   * Get review requests for a user
   */
  async getReviewRequests(userId: string): Promise<any[]> {
    return await db
      .select()
      .from(reviewRequests)
      .where(eq(reviewRequests.userId, userId))
      .orderBy(desc(reviewRequests.createdAt));
  }

  /**
   * Track review request click
   */
  async trackReviewClick(token: string): Promise<void> {
    await db
      .update(reviewRequests)
      .set({
        status: 'clicked',
        clickedAt: new Date(),
      })
      .where(eq(reviewRequests.token, token));
  }

  /**
   * Mark review as completed
   */
  async completeReview(
    token: string,
    rating?: number,
    comment?: string
  ): Promise<void> {
    await db
      .update(reviewRequests)
      .set({
        status: 'completed',
        reviewReceived: true,
        reviewRating: rating,
        reviewComment: comment,
        completedAt: new Date(),
      })
      .where(eq(reviewRequests.token, token));
  }
}

export const automationEngine = new AutomationEngine();
