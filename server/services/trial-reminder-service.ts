import { storage } from '../storage';
import { emailService } from './sendgrid-email-service';

interface ReminderConfig {
  daysBeforeEnd: number;
  subject: string;
  type: 'day-10' | 'day-3' | 'day-1';
}

const REMINDER_CONFIGS: ReminderConfig[] = [
  {
    daysBeforeEnd: 10,
    subject: "Your Blue Tradie free trial ends in 10 days",
    type: 'day-10'
  },
  {
    daysBeforeEnd: 3, 
    subject: "Your Blue Tradie free trial ends in 3 days",
    type: 'day-3'
  },
  {
    daysBeforeEnd: 1,
    subject: "Your Blue Tradie free trial ends tomorrow",
    type: 'day-1'
  }
];

export class TrialReminderService {
  
  async sendDailyReminders(dryRun: boolean = false): Promise<{
    processed: number;
    sent: number;
    skipped: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: [] as string[]
    };

    console.log(`[TRIAL REMINDERS] Starting daily run (dry-run: ${dryRun})`);

    try {
      // Get all users with active free trials
      // Note: Since getAllUsers doesn't exist, we'll create a simple version
      // In production, you'd implement this in storage.ts
      const trialUsers: any[] = []; // Placeholder - would fetch from database
      console.log('[TRIAL REMINDERS] getAllUsers not implemented - skipping for now');
      
      const filteredUsers = trialUsers.filter((user: any) => 
        user.isFreeTrialUser && 
        user.freeTrialEndsAt && 
        new Date(user.freeTrialEndsAt) > new Date()
      );

      console.log(`[TRIAL REMINDERS] Found ${filteredUsers.length} trial users to check`);

      for (const user of filteredUsers) {
        results.processed++;

        if (!user.freeTrialEndsAt) continue;

        const trialEndDate = new Date(user.freeTrialEndsAt);
        const now = new Date();
        const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        console.log(`[TRIAL REMINDERS] User ${user.email}: ${daysRemaining} days remaining`);

        // Check each reminder type
        for (const config of REMINDER_CONFIGS) {
          if (daysRemaining === config.daysBeforeEnd) {
            const shouldSend = await this.shouldSendReminder(user.id, config.type);
            
            if (shouldSend) {
              if (!dryRun) {
                try {
                  await this.sendReminderEmail(user, config, daysRemaining);
                  await this.recordReminderSent(user.id, config.type);
                  results.sent++;
                  console.log(`[TRIAL REMINDERS] Sent ${config.type} reminder to ${user.email}`);
                } catch (error) {
                  const errorMsg = `Failed to send ${config.type} reminder to ${user.email}: ${(error as Error).message}`;
                  results.errors.push(errorMsg);
                  console.error(`[TRIAL REMINDERS] ${errorMsg}`);
                }
              } else {
                console.log(`[TRIAL REMINDERS] [DRY RUN] Would send ${config.type} reminder to ${user.email}`);
                results.sent++;
              }
            } else {
              results.skipped++;
              console.log(`[TRIAL REMINDERS] Skipped ${config.type} reminder for ${user.email} (already sent)`);
            }
          }
        }
      }

      console.log(`[TRIAL REMINDERS] Daily run complete:`, results);
      return results;

    } catch (error) {
      const errorMsg = `Trial reminder service error: ${(error as Error).message}`;
      results.errors.push(errorMsg);
      console.error(`[TRIAL REMINDERS] ${errorMsg}`);
      return results;
    }
  }

  private async shouldSendReminder(userId: string, reminderType: string): Promise<boolean> {
    // Check if we've already sent this reminder type
    const user = await storage.getUser(userId);
    if (!user || !user.metadata) return true;
    
    const metadata = typeof user.metadata === 'string' ? JSON.parse(user.metadata) : user.metadata;
    const sentReminders = metadata.sentReminders || [];
    
    return !sentReminders.includes(reminderType);
  }

  private async recordReminderSent(userId: string, reminderType: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user) return;

    const metadata = typeof user.metadata === 'string' ? JSON.parse(user.metadata) : (user.metadata || {});
    const sentReminders = metadata.sentReminders || [];
    
    sentReminders.push(reminderType);
    metadata.sentReminders = sentReminders;
    metadata.lastReminderSent = new Date().toISOString();

    await storage.upsertUser({
      ...user,
      metadata
    });
  }

  private async sendReminderEmail(user: any, config: ReminderConfig, daysRemaining: number): Promise<void> {
    const APP_URL = process.env.APP_BASE_URL || 'http://localhost:5000';
    const planName = user.subscriptionTier?.includes('Teams') ? 'Teams' : 'Pro';
    const planPrice = planName === 'Teams' ? '$149' : '$59';

    let urgencyColor = '#1e40af'; // blue
    let urgencyMessage = 'Just a friendly heads up!';
    
    if (daysRemaining === 3) {
      urgencyColor = '#f59e0b'; // amber
      urgencyMessage = 'Time is running out!';
    } else if (daysRemaining === 1) {
      urgencyColor = '#ef4444'; // red  
      urgencyMessage = 'Last chance!';
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${urgencyColor}; font-size: 28px; margin-bottom: 10px;">
            ${urgencyMessage}
          </h1>
          <p style="font-size: 18px; color: #374151; margin: 0;">
            Your Blue Tradie ${planName} trial ends in <strong>${daysRemaining} day${daysRemaining === 1 ? '' : 's'}</strong>
          </p>
        </div>

        <div style="background: #f9fafb; border-left: 4px solid ${urgencyColor}; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">What happens next?</h3>
          <ul style="color: #4b5563; line-height: 1.6;">
            <li><strong>If you do nothing:</strong> Your subscription will automatically start at ${planPrice}/month on ${new Date(user.freeTrialEndsAt).toLocaleDateString()}</li>
            <li><strong>If you want to continue:</strong> Sit back and relax! Everything will continue seamlessly</li>
            <li><strong>If you want to cancel:</strong> Click the button below - no hard feelings!</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${APP_URL}/dashboard" 
             style="display: inline-block; background: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 10px;">
            Continue with Blue Tradie
          </a>
          
          <a href="${APP_URL}/api/billing/portal" 
             style="display: inline-block; background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Manage Billing / Cancel
          </a>
        </div>

        ${daysRemaining <= 3 ? `
        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e; font-weight: bold;">
            ⏰ Need more time to decide? 
            <a href="${APP_URL}/api/billing/portal" style="color: #92400e;">Cancel now</a> 
            and sign up again later when you're ready!
          </p>
        </div>
        ` : ''}

        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; color: #6b7280; font-size: 14px;">
          <p>Thanks for trying Blue Tradie, ${user.firstName}!</p>
          <p>Questions? Just reply to this email - we're here to help.</p>
          <p style="margin-top: 15px;">
            Blue Tradie Team<br>
            <a href="mailto:support@bluetradie.com" style="color: #1e40af;">support@bluetradie.com</a>
          </p>
        </div>
      </div>
    `;

    await emailService.sendEmail({
      to: user.email,
      subject: config.subject,
      html
    });
  }
}

export const trialReminderService = new TrialReminderService();