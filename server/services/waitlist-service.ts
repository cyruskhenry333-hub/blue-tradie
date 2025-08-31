// Waitlist management system for Blue Tradie beta
import { eq, sql } from 'drizzle-orm';
import { db } from '../db';
import { waitlist, type InsertWaitlist, type SelectWaitlist } from '@shared/schema';
import { developmentTriggerService } from './development-trigger-service';

class WaitlistService {
  private generateMagicToken(): string {
    // Generate a secure random token for demo access
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async addToWaitlist(entry: InsertWaitlist): Promise<SelectWaitlist> {
    try {
      // Check if email already exists
      const existing = await db
        .select()
        .from(waitlist)
        .where(eq(waitlist.email, entry.email));

      if (existing.length > 0) {
        // If already exists, still send welcome email to ensure user gets it
        console.log(`[WAITLIST] Email ${entry.email} already exists - sending welcome email anyway`);
        
        // Always send welcome email for returning users
        await this.sendWaitlistConfirmationEmail(existing[0]);
        
        return existing[0];
      }

      // Insert new waitlist entry (using existing schema)
      const [waitlistEntry] = await db
        .insert(waitlist)
        .values({
          ...entry,
          notified: false,
          priority: 0
        })
        .returning();

      // Generate proper sequential VIP number and demo code
      // Ra is Demo13 (VIP position 1). Next user should be Demo14 (VIP position 2).
      // Get highest existing demo code number and increment
      const existingCodes = await db.select({ demoCode: waitlist.demoCode }).from(waitlist).where(sql`${waitlist.demoCode} IS NOT NULL`);
      const demoNumbers = existingCodes
        .map(entry => entry.demoCode?.replace('Demo', ''))
        .filter(num => num && !isNaN(Number(num)))
        .map(Number)
        .sort((a, b) => b - a);
      
      const nextDemoNumber = demoNumbers.length > 0 ? demoNumbers[0] + 1 : 13;
      const demoCode = `Demo${nextDemoNumber}`;
      
      const [updatedEntry] = await db
        .update(waitlist)
        .set({ 
          demoCode
        })
        .where(eq(waitlist.id, waitlistEntry.id))
        .returning();
    
      // Send confirmation email with updated entry - ENABLED for production
      await this.sendWaitlistConfirmationEmail(updatedEntry);
      
      // DISABLED: Admin notification (was causing extra emails)
      // await this.sendAdminNotification(waitlistEntry);
      
      const totalCount = await this.getWaitlistCount();
      console.log(`[WAITLIST] Added ${entry.email} to waitlist. Total: ${totalCount}`);
      
      // DISABLED: Development trigger service (was causing dual emails)
      // await developmentTriggerService.checkAndTriggerDevelopment();
      
      return updatedEntry;
    } catch (error: any) {
      console.error('Error adding to waitlist:', error);
      
      // Handle duplicate key constraint violation
      if (error.code === '23505') {
        // Get the existing entry and return it
        const existing = await db
          .select()
          .from(waitlist)
          .where(eq(waitlist.email, entry.email))
          .limit(1);
          
        if (existing.length > 0) {
          console.log(`[WAITLIST] Returning existing entry for ${entry.email}`);
          // DISABLED: Confirmation email for duplicate entries (was causing dual emails)
          // await this.sendWaitlistConfirmationEmail(existing[0]);
          return existing[0];
        }
      }
      
      throw error;
    }
  }

  async getWaitlistCount(): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(waitlist);
      
      const realCount = Number(result[0]?.count || 0);
      
      // Add 12-count buffer for display purposes (shows 13 instead of 1)
      return realCount + 12;
    } catch (error) {
      console.error('Error getting waitlist count:', error);
      return 12; // Return baseline if database error
    }
  }

  async getRealWaitlistCount(): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(waitlist);
      
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error('Error getting real waitlist count:', error);
      return 0;
    }
  }

  async getWaitlistPosition(email: string): Promise<number | null> {
    try {
      const entries = await db
        .select({ id: waitlist.id, signupDate: waitlist.signupDate })
        .from(waitlist)
        .orderBy(waitlist.signupDate);

      const index = entries.findIndex(entry => entry.id);
      return index >= 0 ? index + 1 : null;
    } catch (error) {
      console.error('Error getting waitlist position:', error);
      return null;
    }
  }

  async exportWaitlist(): Promise<SelectWaitlist[]> {
    try {
      return await db
        .select()
        .from(waitlist)
        .orderBy(waitlist.signupDate);
    } catch (error) {
      console.error('Error exporting waitlist:', error);
      return [];
    }
  }

  async removeFromWaitlist(email: string): Promise<void> {
    try {
      await db
        .delete(waitlist)
        .where(eq(waitlist.email, email));
      
      console.log(`[WAITLIST] Removed ${email} from waitlist`);
    } catch (error) {
      console.error('Error removing from waitlist:', error);
      throw error;
    }
  }

  async promoteFromWaitlist(count: number = 1): Promise<SelectWaitlist[]> {
    try {
      // Get eligible entries (not yet notified, ordered by priority then signup date)
      const eligible = await db
        .select()
        .from(waitlist)
        .where(eq(waitlist.notified, false))
        .orderBy(waitlist.priority, waitlist.signupDate)
        .limit(count);

      if (eligible.length === 0) {
        return [];
      }

      // Mark as notified
      const promotedIds = eligible.map(entry => entry.id);
      await db
        .update(waitlist)
        .set({ notified: true, updatedAt: new Date() })
        .where(sql`${waitlist.id} = ANY(${promotedIds})`);

      // Send beta access emails
      for (const entry of eligible) {
        await this.sendBetaAccessEmail(entry);
      }

      console.log(`[WAITLIST] Promoted ${eligible.length} users from waitlist`);
      
      return eligible;
    } catch (error) {
      console.error('Error promoting from waitlist:', error);
      return [];
    }
  }

  private async sendWaitlistConfirmationEmail(entry: SelectWaitlist): Promise<void> {
    try {
      // Send ONLY welcome email using VIP Sign-Up Flow Aug 2025 templates - NO demo email triggered
      const sendgridEmailServiceModule = await import('./sendgrid-email-service');
      const emailService = new sendgridEmailServiceModule.SendGridEmailService();
      
      // Import VIP Sign-Up Flow LOCKED PRODUCTION templates (August 2025)
      const { vipSignUpFlowLockedAug2025 } = await import('./vip-signup-flow-locked-aug2025');
      
      const welcomeEmailHtml = vipSignUpFlowLockedAug2025.generateWelcomeEmail(entry);
      
      await emailService.sendEmail({
        to: entry.email,
        subject: 'Blue Tradie VIP Signup Confirmed',
        html: welcomeEmailHtml
      });
      
      console.log(`[WAITLIST] VIP Welcome email sent to ${entry.email} using Aug 2025 templates (NO demo email)`);
    } catch (error) {
      console.error(`[WAITLIST EMAIL] Failed to send welcome email to ${entry.email}:`, error);
      // Don't throw error - signup should still succeed even if email fails
    }
  }

  // HOUSEKEEPING: Legacy welcome email template completely removed for production cleanliness
  // All welcome emails now use VIP Sign-Up Flow Aug 2025 templates exclusively via vipSignUpFlow.generateWelcomeEmail()

  private async sendBetaAccessEmail(entry: SelectWaitlist): Promise<void> {
    const greeting = entry.country === "New Zealand" ? "Hey bro" : "G'day mate";
    console.log(`[WAITLIST PROMOTION] Sending beta access email to ${entry.email}`);
    // TODO: Send "You're off the waitlist!" email with beta signup link
  }

  private async getNextVipNumber(): Promise<number> {
    // Simple increment based on current database records
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(waitlist);
    
    const realCount = Number(result[0]?.count || 0);
    return realCount + 1;
  }

  private async sendAdminNotification(entry: SelectWaitlist): Promise<void> {
    try {
      const adminEmail = process.env.FROM_EMAIL || 'support@bluetradie.com';
      const waitlistCount = await this.getWaitlistCount();
      
      const emailContent = this.generateAdminNotificationEmail(entry, waitlistCount);
      
      // Use the proper SendGrid email service
      const { emailService } = await import('./sendgrid-email-service');
      
      const success = await emailService.sendEmail({
        to: adminEmail,
        subject: `🚀 New Blue Tradie Waitlist Signup - ${entry.firstName || 'User'} from ${entry.country}`,
        html: emailContent
      });
      
      if (success) {
        console.log(`[ADMIN NOTIFICATION] New waitlist signup notification sent for ${entry.email}`);
      } else {
        console.log(`[ADMIN NOTIFICATION] Failed to send notification for ${entry.email}`);
      }
    } catch (error) {
      console.error(`[ADMIN NOTIFICATION] Failed to send notification for ${entry.email}:`, error);
      // Don't throw error - signup should still succeed even if admin notification fails
    }
  }

  private generateAdminNotificationEmail(entry: SelectWaitlist, totalCount: number): string {
    const signupTime = entry.signupDate ? new Date(entry.signupDate).toLocaleString('en-AU', { 
      timeZone: 'Australia/Sydney',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Unknown';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Blue Tradie Waitlist Signup</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 8px; }
        .user-details { background: #fff; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ea580c; }
        .stats { background: #e0f2fe; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 New Waitlist Signup</h1>
            <p>Someone just joined the Blue Tradie waitlist!</p>
        </div>
        
        <div class="content">
            <div class="user-details">
                <h3>👤 User Details</h3>
                <p><strong>Name:</strong> ${entry.firstName || 'Not provided'} ${entry.lastName || ''}</p>
                <p><strong>Email:</strong> ${entry.email}</p>
                <p><strong>Country:</strong> ${entry.country || 'Not specified'}</p>
                <p><strong>Trade:</strong> ${entry.trade || 'Not specified'}</p>
                <p><strong>Signup Time:</strong> ${signupTime}</p>
            </div>
            
            <div class="stats">
                <h3>📊 Waitlist Stats</h3>
                <p><strong>Total Waitlist:</strong> ${totalCount} ${totalCount === 1 ? 'person' : 'people'}</p>
                <p><strong>This Month:</strong> Growing momentum! 🎯</p>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>User received confirmation email automatically</li>
                <li>They're in the queue for beta access</li>
                <li>Consider reaching out personally for high-value trades</li>
            </ul>
            
            <p>This notification was sent automatically by the Blue Tradie waitlist system.</p>
        </div>
        
        <div class="footer">
            <p>Blue Tradie Admin Notifications | Check the admin dashboard for full details</p>
        </div>
    </div>
</body>
</html>`;
  }

  private generateWaitlistEmail(entry: SelectWaitlist, greeting: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>You're on the Blue Tradie Waitlist!</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 8px; }
        .highlight { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .button { display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Blue Tradie VIP Waitlist!</h1>
            <p>${entry.firstName || 'There'}, ${greeting}! You're VIP Member #${1} - Save $108 First Year!</p>
        </div>
        
        <div class="content">
            <p>You have successfully joined our waitlist for Blue Tradie beta access.</p>
            
            <div class="highlight">
                <h3>🎯 Your VIP Benefits Confirmed</h3>
                <ul>
                    <li>💰 <strong>30% off Blue Lite first year</strong> - Save $108 on $29.99/month (first 100 users only)</li>
                    <li>🤖 <strong>1,000,000 free AI tokens</strong> - Real conversations with your AI business team</li>
                    <li>👑 <strong>Founding Member upgrade path</strong> - Video testimonial = premium discounts</li>
                    <li>⚡ <strong>14-day demo when we launch</strong> - Skip the wait, priority access</li>
                </ul>
            </div>
            
            <div class="highlight">
                <h3>🚀 Early Access Available</h3>
                <p>Can't wait for 100 signups? We understand! If you need Blue Tradie now to help your business, <strong>early access is available</strong>.</p>
                <p><strong>Want early access?</strong> Just reply to this email and request your demo link. We'll send it through manually while the platform is being refined.</p>
            </div>
            
            <div class="highlight">
                <h3>🤖 AI Business Team Ready</h3>
                <p>When your spot opens, your personalized AI business team (Accountant, Marketer, Business Coach & Legal advisor) will be pre-configured for ${entry.country === "New Zealand" ? "New Zealand" : "Australian"} business requirements!</p>
                
                <h4>What makes Blue Tradie special for ${entry.country}:</h4>
                <ul>
                    <li>✅ GST automatically set to ${entry.country === "New Zealand" ? "15%" : "10%"}</li>
                    <li>✅ AI agents trained on ${entry.country === "New Zealand" ? "IRD" : "ATO"} regulations</li>
                    <li>✅ Contract templates for ${entry.country} law</li>
                    <li>✅ Region-specific business advice</li>
                </ul>
            </div>
            
            <p>Questions? Just reply to this email - we read every message.</p>
            
            <p>Thanks for your patience,<br>
            <strong>The Blue Tradie Team</strong></p>
        </div>
        
        <div class="footer">
            <p>Blue Tradie | Building the future of tradie business management</p>
            <p>Unsubscribe | Update preferences</p>
        </div>
    </div>
</body>
</html>`;
  }
}

export const waitlistService = new WaitlistService();