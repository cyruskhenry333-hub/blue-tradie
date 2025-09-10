import { storage } from "../storage";
import { demoService } from "./demo-service";

export class AutoDemoService {
  // Automatically offer demo to new signups
  static async offerDemoToNewUser(userId: string, userEmail: string): Promise<{
    demoOffered: boolean;
    demoCode?: string;
    message: string;
  }> {
    try {
      // Check if user already has demo access
      const user = await storage.getUser(userId);
      if (user?.isDemoUser) {
        return {
          demoOffered: false,
          message: "User already has demo access"
        };
      }

      // Generate demo access code
      const demoCode = this.generateDemoCode();
      
      // Store demo offer temporarily (24 hour expiry)
      await this.storeDemoOffer(userId, demoCode);

      return {
        demoOffered: true,
        demoCode,
        message: "Demo access code generated successfully"
      };
    } catch (error) {
      console.error("Error offering demo:", error);
      return {
        demoOffered: false,
        message: "Failed to generate demo access"
      };
    }
  }

  // Activate demo using access code
  static async activateDemo(userId: string, demoCode: string): Promise<{
    success: boolean;
    user?: any;
    message: string;
  }> {
    try {
      // Verify demo code
      const isValidCode = await this.verifyDemoCode(userId, demoCode);
      if (!isValidCode) {
        return {
          success: false,
          message: "Invalid or expired demo access code"
        };
      }

      // Get user details and create demo
      const user = await storage.getUser(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found"
        };
      }

      // Create demo user with standard settings
      const demoUser = await demoService.createDemoUser({
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        businessName: "", // will be filled in onboarding
        trade: "", // will be filled in onboarding
        serviceArea: "", // will be filled in onboarding
        country: "Australia", // default country
        durationDays: 14, // Standard 14-day trial
        tokenLimit: 1000, // Standard token limit
      });

      // Remove demo offer after activation
      await this.removeDemoOffer(userId);

      // Send welcome email with demo details
      await this.sendDemoWelcomeEmail(demoUser);

      return {
        success: true,
        user: demoUser,
        message: "Demo access activated successfully"
      };
    } catch (error) {
      console.error("Error activating demo:", error);
      return {
        success: false,
        message: "Failed to activate demo access"
      };
    }
  }

  // Generate unique demo access code
  private static generateDemoCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `DEMO-${timestamp}-${random}`.toUpperCase();
  }

  // Store demo offer temporarily
  private static async storeDemoOffer(userId: string, demoCode: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    // Store in user's metadata temporarily
    await storage.updateUser(userId, {
      metadata: {
        demoOffer: {
          code: demoCode,
          expiresAt: expiresAt.toISOString(),
          offered: true
        }
      }
    });
  }

  // Verify demo code is valid and not expired
  private static async verifyDemoCode(userId: string, demoCode: string): Promise<boolean> {
    try {
      const user = await storage.getUser(userId);
      const demoOffer = (user?.metadata as any)?.demoOffer;

      if (!demoOffer || demoOffer.code !== demoCode) {
        return false;
      }

      const expiresAt = new Date(demoOffer.expiresAt);
      if (expiresAt < new Date()) {
        return false; // Expired
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Remove demo offer after activation or expiry
  private static async removeDemoOffer(userId: string): Promise<void> {
    const user = await storage.getUser(userId);
    if (user?.metadata) {
      const metadata = user.metadata as any;
      delete metadata.demoOffer;
      await storage.updateUser(userId, { metadata });
    }
  }

  // Send automated demo welcome email
  private static async sendDemoWelcomeEmail(user: any): Promise<void> {
    const emailContent = this.generateDemoWelcomeEmail(user);
    
    try {
      // Import email service dynamically to avoid circular imports
      const { emailService } = await import("../services/sendgrid-email-service");
      await emailService.sendEmail({
        to: user.email,
        from: process.env.FROM_EMAIL || "noreply@bluetradie.com",
        subject: "🚀 Your Blue Tradie Demo is Ready!",
        html: emailContent,
      });
    } catch (error) {
      console.error("Failed to send demo welcome email:", error);
      // Don't fail the demo creation if email fails
    }
  }

  // Generate demo welcome email content
  private static generateDemoWelcomeEmail(user: any): string {
    const expiryDate = new Date(user.demoExpiresAt).toLocaleDateString('en-AU');
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 28px;">🚀 Your Blue Tradie Demo is Ready!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">14-day comprehensive trial with 1,000 AI tokens</p>
        </div>

        <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #1e40af; margin-top: 0;">📋 Your Demo Details</h2>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Duration:</strong> 14 days (expires ${expiryDate})</li>
            <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>AI Tokens:</strong> 1,000 tokens (~20-30 advisor conversations)</li>
            <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>UGC Incentives:</strong> Enabled - earn bonus tokens!</li>
            <li style="padding: 8px 0;"><strong>Access Level:</strong> Full premium features</li>
          </ul>
        </div>

        <div style="background: #ecfdf5; border: 1px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
          <h3 style="color: #065f46; margin-top: 0;">💡 Understanding AI Tokens</h3>
          <p style="margin-bottom: 15px; color: #047857;">Think of tokens like "conversation credits" with our AI business advisors:</p>
          <ul style="color: #047857; margin-bottom: 15px;">
            <li><strong>Quick questions</strong> (like "What GST rate for NSW?") = ~15 tokens</li>
            <li><strong>Invoice help</strong> = ~35 tokens</li>
            <li><strong>Business planning sessions</strong> = ~80 tokens</li>
          </ul>
          <p style="color: #047857; margin: 0;"><strong>Your 1,000 tokens = sufficient for thorough testing of all AI advisors</strong></p>
        </div>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin-bottom: 25px;">
          <h3 style="color: #92400e; margin-top: 0;">🎁 Share Your Experience & Earn Bonuses</h3>
          <p style="color: #92400e; margin-bottom: 15px;">Help us improve Blue Tradie by sharing your demo experience:</p>
          <ul style="color: #92400e;">
            <li><strong>📱 Social Media Post:</strong> +100 bonus tokens</li>
            <li><strong>⭐ Written Testimonial:</strong> +200 bonus tokens</li>
            <li><strong>📹 Case Study Participation:</strong> +500 tokens + Founding Member Status</li>
          </ul>
          <p style="color: #92400e; margin: 0;"><strong>Founding Members get lifetime 50% discount on AI usage!</strong></p>
        </div>

        <div style="background: #ffffff; border: 2px solid #1e40af; border-radius: 8px; padding: 25px; margin-bottom: 25px; text-align: center;">
          <h3 style="color: #1e40af; margin-top: 0;">🎯 What's Included in Your Demo</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: left;">
            <div>
              <p style="margin: 5px 0;">✅ Complete Job Management</p>
              <p style="margin: 5px 0;">✅ Smart Invoicing</p>
              <p style="margin: 5px 0;">✅ Expense Tracking</p>
            </div>
            <div>
              <p style="margin: 5px 0;">✅ AI Business Advisors</p>
              <p style="margin: 5px 0;">✅ Dashboard Analytics</p>
              <p style="margin: 5px 0;">✅ Goal Setting & Vision Board</p>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 25px;">
          <a href="${process.env.FRONTEND_URL || 'https://bluetradie.com'}" 
             style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Start Your Demo Now →
          </a>
        </div>

        <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; font-size: 14px; color: #64748b;">
          <h4 style="margin-top: 0; color: #475569;">Questions?</h4>
          <p style="margin: 0;">Jump on the platform and ask the AI Advisors! They're designed specifically for Australian tradies and know everything about GST, Fair Work laws, ABN requirements, etc.</p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px;">
          <p>Blue Tradie - AI-Powered Business Management for Australian & NZ Tradies</p>
        </div>
      </div>
    `;
  }

  // Get demo signup statistics
  static async getDemoStats(): Promise<{
    totalOffered: number;
    totalActivated: number;
    conversionRate: number;
    activeDemons: number;
  }> {
    // This would query your analytics/metrics
    // For now, return placeholder structure
    return {
      totalOffered: 0,
      totalActivated: 0,
      conversionRate: 0,
      activeDemons: 0
    };
  }
}