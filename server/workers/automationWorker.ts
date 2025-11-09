/**
 * Automation queue worker
 * Processes delayed automation rules
 */

import { automationQueue } from '../services/queueService';
import { automationEngine } from '../services/automationEngine';
import { db } from '../db';
import { automationRules } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface AutomationJob {
  ruleId: number;
  context: {
    userId: string;
    jobId?: number;
    invoiceId?: number;
    quoteId?: number;
    customerName?: string;
    customerEmail?: string;
    amount?: string;
    jobTitle?: string;
    [key: string]: any;
  };
}

// Process automation jobs
automationQueue.process(async (job) => {
  console.log(`[AutomationWorker] Processing job ${job.id}:`, job.data);

  const { ruleId, context }: AutomationJob = job.data;

  try {
    // Fetch the rule
    const [rule] = await db
      .select()
      .from(automationRules)
      .where(eq(automationRules.id, ruleId))
      .limit(1);

    if (!rule) {
      throw new Error(`Automation rule ${ruleId} not found`);
    }

    // Check if rule is still active
    if (!rule.isActive) {
      console.log(`[AutomationWorker] Rule ${ruleId} is inactive, skipping`);
      return { skipped: true, reason: 'Rule inactive' };
    }

    // Execute the rule
    await automationEngine.executeRule(rule, context);

    return { success: true, ruleId, context };
  } catch (error) {
    console.error(`[AutomationWorker] Job ${job.id} failed:`, error);
    throw error; // Bull will retry based on job options
  }
});

// Handle completed jobs
automationQueue.on('completed', (job, result) => {
  console.log(`[AutomationWorker] Completed job ${job.id}:`, result);
});

// Handle failed jobs
automationQueue.on('failed', (job, err) => {
  console.error(`[AutomationWorker] Failed job ${job?.id}:`, err.message);
});

console.log('[AutomationWorker] Started and listening for jobs');

export default automationQueue;
