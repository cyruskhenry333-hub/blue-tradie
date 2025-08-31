// Email scheduling service for automated follow-ups
import { waitlistEmailAutomation } from './waitlist-email-automation';

export class EmailScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the email scheduler - runs every hour
   */
  start(): void {
    if (this.isRunning) {
      console.log('[EMAIL SCHEDULER] Already running');
      return;
    }

    this.isRunning = true;
    console.log('[EMAIL SCHEDULER] Starting automated email scheduler');

    // Run immediately once, then every hour
    this.runScheduledEmails();
    
    // Run every hour (3600000ms)
    this.intervalId = setInterval(() => {
      this.runScheduledEmails();
    }, 3600000); // 1 hour
  }

  /**
   * Stop the email scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[EMAIL SCHEDULER] Email scheduler stopped');
  }

  /**
   * Run scheduled email checks
   */
  private async runScheduledEmails(): Promise<void> {
    try {
      console.log('[EMAIL SCHEDULER] Running scheduled email checks...');
      
      // Send day 7 follow-ups
      const day7Count = await waitlistEmailAutomation.sendDay7FollowUp();
      if (day7Count > 0) {
        console.log(`[EMAIL SCHEDULER] Sent ${day7Count} day 7 follow-up emails`);
      }

      // Send day 14 video requests
      const day14Count = await waitlistEmailAutomation.sendDay14VideoRequest();
      if (day14Count > 0) {
        console.log(`[EMAIL SCHEDULER] Sent ${day14Count} day 14 video request emails`);
      }

      console.log('[EMAIL SCHEDULER] Scheduled email check completed');
    } catch (error) {
      console.error('[EMAIL SCHEDULER] Error during scheduled email run:', error);
    }
  }

  /**
   * Check if scheduler is running
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; nextRun?: Date } {
    return {
      isRunning: this.isRunning,
      nextRun: this.isRunning ? new Date(Date.now() + 3600000) : undefined
    };
  }
}

export const emailScheduler = new EmailScheduler();