import { emailService } from './sendgrid-email-service';

const EMAIL_TIMEOUT_MS = 10000; // 10 seconds
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Blue Tradie';
const EMAIL_FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS || 'noreply@bluetradie.com';
const DISABLE_EMAIL_SENDING = process.env.DISABLE_EMAIL_SENDING === 'true';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailServiceWrapper {
  
  async sendEmail(options: EmailOptions): Promise<boolean> {
    // In preview mode, just log the email instead of sending
    if (DISABLE_EMAIL_SENDING) {
      console.log('[EMAIL] Preview mode - would send email:', {
        to: options.to,
        subject: options.subject,
        from: options.from || `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
      });
      console.log('[EMAIL] HTML content:', options.html);
      return true;
    }
    
    try {
      // Add timeout to email sending
      const emailPromise = emailService.sendEmail({
        to: options.to,
        subject: options.subject,
        html: options.html,
        from: options.from || `${EMAIL_FROM_NAME} <${EMAIL_FROM_ADDRESS}>`,
      });
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Email timeout')), EMAIL_TIMEOUT_MS);
      });
      
      await Promise.race([emailPromise, timeoutPromise]);
      
      console.log('[EMAIL] Successfully sent email to:', options.to);
      return true;
      
    } catch (error) {
      console.error('[EMAIL] Failed to send email:', error);
      return false;
    }
  }
  
  async sendMagicLink(email: string, firstName: string, loginUrl: string): Promise<boolean> {
    const subject = 'Log in to Blue Tradie';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Log in to Blue Tradie</h2>
        <p>Hi ${firstName},</p>
        <p>Click the button below to securely log in to your Blue Tradie account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" 
             style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
            Log In to Blue Tradie
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          This link expires in 15 minutes. If you didn't request this, you can safely ignore this email.
        </p>
        <p style="color: #666; font-size: 12px;">
          If the button doesn't work, copy this link: ${loginUrl}
        </p>
      </div>
    `;
    
    return this.sendEmail({ to: email, subject, html });
  }
  
  async sendWelcomeWithMagicLink(email: string, firstName: string, plan: string, loginUrl: string): Promise<boolean> {
    const subject = 'Welcome to Blue Tradie - Your Free Trial Starts Now! 🎉';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Welcome to Blue Tradie, ${firstName}!</h2>
        <p>Your ${plan === 'teams' ? 'Teams' : 'Pro'} plan trial has started! You have 30 days of full access.</p>
        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin: 0; color: #1e40af;">What's Next?</h3>
          <ul style="margin: 10px 0;">
            <li>✅ Chat with your 6 AI Business Advisors</li>
            <li>✅ Create professional invoices with GST</li>
            <li>✅ Connect with other tradies in the directory</li>
            <li>✅ Set up smart business automation</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" 
             style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; margin-bottom: 15px;">
            Access Your Dashboard
          </a>
        </div>
        <div style="background: #e0f2fe; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #0288d1;">
          <h4 style="margin: 0 0 10px 0; color: #01579b;">🔐 Secure Access</h4>
          <p style="margin: 0; color: #01579b; font-size: 14px;">
            We use secure email login - no passwords to remember! This link will log you in automatically. 
            For future access, visit our login page and enter your email to receive a new secure link.
          </p>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Your free trial ends on ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}. 
          You'll receive 3 reminder emails before billing starts. Cancel anytime!
        </p>
      </div>
    `;
    
    return this.sendEmail({ to: email, subject, html });
  }

  async sendWelcomeEmail(email: string, firstName: string, plan: string): Promise<boolean> {
    const subject = 'Welcome to Blue Tradie - Your Free Trial Starts Now! 🎉';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Welcome to Blue Tradie, ${firstName}!</h2>
        <p>Your ${plan === 'teams' ? 'Teams' : 'Pro'} plan trial has started! You have 30 days of full access.</p>
        <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin: 0; color: #1e40af;">What's Next?</h3>
          <ul style="margin: 10px 0;">
            <li>✅ Chat with your 6 AI Business Advisors</li>
            <li>✅ Create professional invoices with GST</li>
            <li>✅ Connect with other tradies in the directory</li>
            <li>✅ Set up smart business automation</li>
          </ul>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://bluetradie.com/login"
             style="background: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
            Log In to Your Dashboard
          </a>
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          Your free trial ends on ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}.
          You'll receive reminder emails before billing starts. Cancel anytime!
        </p>
      </div>
    `;

    return this.sendEmail({ to: email, subject, html });
  }

  async sendPaymentFailedEmail(
    email: string,
    firstName: string,
    details: {
      invoiceId: string;
      amount: { amount_cents: number; amount: string };
      attemptCount: number;
      paymentUpdateUrl: string;
    }
  ): Promise<boolean> {
    const subject = '⚠️ Payment Failed - Update Your Payment Method';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Payment Failed</h2>
        <p>Hi ${firstName},</p>
        <p>We were unable to process your payment for your Blue Tradie subscription.</p>
        <div style="background: #fee2e2; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626;">
          <p style="margin: 0; font-weight: 600; color: #991b1b;">Invoice: ${details.invoiceId}</p>
          <p style="margin: 5px 0 0 0; font-weight: 600; color: #991b1b;">Amount: $${details.amount.amount} AUD</p>
          <p style="margin: 5px 0 0 0; color: #991b1b; font-size: 14px;">Attempt: ${details.attemptCount}/4</p>
        </div>
        <p>To avoid service interruption, please update your payment method as soon as possible.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${details.paymentUpdateUrl}"
             style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
            Update Payment Method
          </a>
        </div>
        ${details.attemptCount >= 3 ? `
        <div style="background: #fef3c7; padding: 15px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e; font-weight: 600;">⚠️ Final Reminder</p>
          <p style="margin: 5px 0 0 0; color: #92400e; font-size: 14px;">
            This is attempt ${details.attemptCount} of 4. If payment fails again, your subscription will be cancelled.
          </p>
        </div>
        ` : ''}
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          If you have questions or need assistance, please contact support at support@bluetradie.com
        </p>
      </div>
    `;

    return this.sendEmail({ to: email, subject, html });
  }
}

export const emailServiceWrapper = new EmailServiceWrapper();