import { emailService } from './sendgrid-email-service';
import { db } from '../db';
import { waitlist } from '@shared/schema';
import { count } from 'drizzle-orm';

interface DevelopmentTriggerState {
  hasTriggered: boolean;
  triggerCount: number;
  triggeredAt?: Date;
  notificationsSent: string[];
}

class DevelopmentTriggerService {
  private static instance: DevelopmentTriggerService;
  private state: DevelopmentTriggerState = {
    hasTriggered: false,
    triggerCount: 100, // Can be adjusted to 114 if needed
    notificationsSent: []
  };
  
  private readonly TRIGGER_EMAIL = 'support@bluetradie.com';
  private readonly DEV_TEAM_EMAILS = [
    'support@bluetradie.com',
    // Add development team emails here
  ];

  public static getInstance(): DevelopmentTriggerService {
    if (!DevelopmentTriggerService.instance) {
      DevelopmentTriggerService.instance = new DevelopmentTriggerService();
    }
    return DevelopmentTriggerService.instance;
  }

  /**
   * Check current waitlist count and trigger development if threshold reached
   */
  async checkAndTriggerDevelopment(): Promise<void> {
    try {
      // Get current waitlist count
      const result = await db.select({ count: count() }).from(waitlist);
      const currentCount = result[0]?.count || 0;
      
      console.log(`[DEV TRIGGER] Current waitlist count: ${currentCount}/${this.state.triggerCount}`);
      
      // Check if we've reached the trigger threshold
      if (currentCount >= this.state.triggerCount && !this.state.hasTriggered) {
        await this.triggerDevelopmentPhase(currentCount);
      }
      
      // Send milestone notifications at key points
      await this.sendMilestoneNotifications(currentCount);
      
    } catch (error) {
      console.error('[DEV TRIGGER] Error checking development trigger:', error);
    }
  }

  /**
   * Trigger Phase 1 development initiation
   */
  private async triggerDevelopmentPhase(currentCount: number): Promise<void> {
    console.log(`🚀 [DEV TRIGGER] PHASE 1 DEVELOPMENT TRIGGERED! Count: ${currentCount}`);
    
    this.state.hasTriggered = true;
    this.state.triggeredAt = new Date();
    
    // Send immediate trigger notification
    await this.sendDevelopmentTriggerNotification(currentCount);
    
    // Send detailed development plan
    await this.sendDevelopmentPlanEmail(currentCount);
    
    console.log(`✅ [DEV TRIGGER] Development team has been notified. Phase 1 can begin!`);
  }

  /**
   * Send immediate development trigger notification
   */
  private async sendDevelopmentTriggerNotification(count: number): Promise<void> {
    const subject = `🚀 BLUE TRADIE: Phase 1 Development TRIGGERED! (${count} signups)`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🚀 DEVELOPMENT TRIGGERED!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px; opacity: 0.9;">Blue Tradie Phase 1 Ready to Begin</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <div style="background: white; padding: 25px; border-radius: 8px; border-left: 4px solid #10b981;">
            <h2 style="color: #1f2937; margin-top: 0;">🎯 Milestone Achieved!</h2>
            <p style="font-size: 18px; margin: 15px 0;"><strong>Waitlist Signups: ${count}/100</strong></p>
            <p style="margin: 15px 0;">The trigger threshold has been reached. Phase 1 development can now begin according to the development roadmap.</p>
          </div>
          
          <div style="background: white; padding: 25px; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #1f2937; margin-top: 0;">📋 Next Steps:</h3>
            <ol style="color: #4b5563; line-height: 1.6;">
              <li><strong>Review Development Specification:</strong> Check PHASE_1_DEVELOPMENT_SPEC.md</li>
              <li><strong>Team Assembly:</strong> Gather development team for Phase 1</li>
              <li><strong>Sprint Planning:</strong> Begin Sprint 1 - Mobile-First Job Management</li>
              <li><strong>Timeline:</strong> 3-4 month development period</li>
            </ol>
          </div>
          
          <div style="background: white; padding: 25px; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #1f2937; margin-top: 0;">🏗️ Phase 1 Development Focus:</h3>
            <ul style="color: #4b5563; line-height: 1.6;">
              <li>GPS Job Verification System</li>
              <li>Offline Mobile Capabilities</li>
              <li>Partner/Admin Dashboard</li>
              <li>Basic Team Coordination</li>
              <li>AI-Powered Route Optimization</li>
              <li>Smart Automation Features</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p style="color: #6b7280; font-size: 14px;">
              Triggered automatically at ${new Date().toLocaleString('en-AU', { 
                timeZone: 'Australia/Sydney',
                dateStyle: 'full',
                timeStyle: 'short'
              })}
            </p>
          </div>
        </div>
      </div>
    `;

    try {
      await emailService.sendEmail({
        to: this.TRIGGER_EMAIL,
        subject,
        html: htmlContent
      });
      
      console.log(`📧 [DEV TRIGGER] Trigger notification sent to ${this.TRIGGER_EMAIL}`);
    } catch (error) {
      console.error('[DEV TRIGGER] Error sending trigger notification:', error);
    }
  }

  /**
   * Send detailed development plan email
   */
  private async sendDevelopmentPlanEmail(count: number): Promise<void> {
    const subject = `📋 Blue Tradie Phase 1 Development Plan & Specifications`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1f2937; color: white; padding: 25px; text-align: center;">
          <h1 style="margin: 0;">📋 Development Plan Ready</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.8;">Complete specifications and roadmap</p>
        </div>
        
        <div style="background: #f9fafb; padding: 25px;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">🎯 Current Status</h2>
            <p><strong>Waitlist Count:</strong> ${count} signups</p>
            <p><strong>Development Ready:</strong> ✅ Yes</p>
            <p><strong>Timeline:</strong> 3-4 months (16 weeks)</p>
            <p><strong>Target Market:</strong> AU/NZ sole traders & small teams</p>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">📖 Available Documentation</h2>
            <ul style="line-height: 1.6;">
              <li><strong>replit.md:</strong> Complete roadmap and technical architecture</li>
              <li><strong>PHASE_1_DEVELOPMENT_SPEC.md:</strong> Detailed technical specifications</li>
              <li><strong>AI_EDUCATION_FRAMEWORK.md:</strong> User education and safety approach</li>
            </ul>
          </div>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">🏃‍♂️ Sprint Breakdown</h2>
            <div style="margin: 15px 0;">
              <strong>Sprint 1 (Month 1):</strong> Mobile-First Job Management
              <ul style="margin-top: 5px;">
                <li>GPS Job Verification System</li>
                <li>Offline Mobile Capabilities</li>
              </ul>
            </div>
            <div style="margin: 15px 0;">
              <strong>Sprint 2 (Month 2):</strong> Family Business Admin Tools
              <ul style="margin-top: 5px;">
                <li>Partner/Admin Dashboard</li>
                <li>Basic Team Coordination (Max 5 People)</li>
              </ul>
            </div>
            <div style="margin: 15px 0;">
              <strong>Sprint 3 (Month 3):</strong> Daily Efficiency Tools
              <ul style="margin-top: 5px;">
                <li>AI-Powered Route Optimization</li>
                <li>Enhanced Mobile Experience</li>
              </ul>
            </div>
            <div style="margin: 15px 0;">
              <strong>Sprint 4 (Month 4):</strong> Smart Automation Features
              <ul style="margin-top: 5px;">
                <li>AI-Enhanced Workflows</li>
                <li>Customer Sentiment Tracking</li>
              </ul>
            </div>
          </div>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0;">⚠️ Key Success Criteria</h3>
            <ul style="color: #92400e; line-height: 1.6;">
              <li>95% GPS job verification usage</li>
              <li>80% offline functionality adoption</li>
              <li>70% partner dashboard usage</li>
              <li>90% user retention after 3 months</li>
              <li>20% average time savings per job day</li>
            </ul>
          </div>
        </div>
      </div>
    `;

    try {
      await emailService.sendEmail({
        to: this.TRIGGER_EMAIL,
        subject,
        html: htmlContent
      });
      
      console.log(`📋 [DEV TRIGGER] Development plan sent to ${this.TRIGGER_EMAIL}`);
    } catch (error) {
      console.error('[DEV TRIGGER] Error sending development plan:', error);
    }
  }

  /**
   * Send milestone notifications at key signup numbers
   */
  private async sendMilestoneNotifications(currentCount: number): Promise<void> {
    const milestones = [25, 50, 75, 90, 95];
    
    for (const milestone of milestones) {
      if (currentCount >= milestone && !this.state.notificationsSent.includes(`milestone_${milestone}`)) {
        await this.sendMilestoneEmail(milestone, currentCount);
        this.state.notificationsSent.push(`milestone_${milestone}`);
      }
    }
  }

  /**
   * Send milestone progress email
   */
  private async sendMilestoneEmail(milestone: number, currentCount: number): Promise<void> {
    const progress = Math.round((currentCount / this.state.triggerCount) * 100);
    const remaining = this.state.triggerCount - currentCount;
    
    const subject = `🎯 Blue Tradie Milestone: ${milestone} Signups Reached! (${progress}% to dev trigger)`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(45deg, #3b82f6, #8b5cf6); color: white; padding: 25px; text-align: center;">
          <h1 style="margin: 0;">🎯 Milestone Achieved!</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">${milestone} Waitlist Signups</p>
        </div>
        
        <div style="background: #f8fafc; padding: 25px;">
          <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h2 style="color: #1f2937; margin-top: 0;">Progress to Development Trigger</h2>
            <div style="background: #e5e7eb; height: 20px; border-radius: 10px; margin: 20px 0;">
              <div style="background: linear-gradient(90deg, #10b981, #3b82f6); height: 100%; width: ${progress}%; border-radius: 10px; transition: width 0.3s ease;"></div>
            </div>
            <p style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 15px 0;">
              ${currentCount} / ${this.state.triggerCount} signups (${progress}%)
            </p>
            <p style="color: #6b7280; font-size: 16px;">
              ${remaining} more signups needed to trigger Phase 1 development
            </p>
          </div>
          
          ${milestone >= 75 ? `
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0;">🚀 Almost Ready!</h3>
            <p style="color: #92400e; margin: 0;">Development trigger is approaching. Development team should prepare for Phase 1 initiation.</p>
          </div>
          ` : ''}
        </div>
      </div>
    `;

    try {
      await emailService.sendEmail({
        to: this.TRIGGER_EMAIL,
        subject,
        html: htmlContent
      });
      
      console.log(`🎯 [DEV TRIGGER] Milestone ${milestone} notification sent`);
    } catch (error) {
      console.error(`[DEV TRIGGER] Error sending milestone ${milestone} notification:`, error);
    }
  }

  /**
   * Manual trigger for testing or adjustment
   */
  async manualTrigger(reason: string = 'Manual trigger'): Promise<void> {
    console.log(`🔧 [DEV TRIGGER] Manual trigger activated: ${reason}`);
    
    const result = await db.select({ count: count() }).from(waitlist);
    const currentCount = result[0]?.count || 0;
    
    await this.triggerDevelopmentPhase(currentCount);
  }

  /**
   * Get current trigger status
   */
  getTriggerStatus(): DevelopmentTriggerState {
    return { ...this.state };
  }

  /**
   * Update trigger count if needed
   */
  updateTriggerCount(newCount: number): void {
    this.state.triggerCount = newCount;
    console.log(`[DEV TRIGGER] Trigger count updated to: ${newCount}`);
  }
}

export const developmentTriggerService = DevelopmentTriggerService.getInstance();