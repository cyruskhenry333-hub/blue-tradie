// SendGrid Email Service for Blue Tradie
import { MailService } from '@sendgrid/mail';
// Cleaned up - removed unused tier email imports
import UsageMonitor from '../middleware/usage-monitor';

// Initialize SendGrid
let mailService: MailService | null = null;

function initializeSendGrid(): MailService | null {
  // Use only the working API key - removed old SENDGRID_API_KEY_BLUETRADIE
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    console.log(`📧 Initializing SendGrid email service with key (${apiKey.length} chars)`);
    const service = new MailService();
    service.setApiKey(apiKey);
    return service;
  }
  
  console.log('⚠️ No SendGrid API key found - running in test mode');
  return null;
}

// Initialize on module load
mailService = initializeSendGrid();

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class SendGridEmailService {
  private mailService: MailService | null;
  private isTestMode: boolean;
  private defaultFrom: string;

  constructor() {
    this.mailService = mailService;
    this.isTestMode = !this.mailService;
   const fromAddr = process.env.EMAIL_FROM;                 // e.g. support@bluetradie.com
const fromName = process.env.EMAIL_FROM_NAME || 'Blue Tradie';
if (!fromAddr) throw new Error('EMAIL_FROM is not set');
this.defaultFrom = `${fromName} <${fromAddr}>`;

  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const fromEmail = options.from || this.defaultFrom;
    
    if (this.isTestMode) {
      // Test mode - log email details instead of sending
      console.log('📧 TEST MODE - Email would be sent:');
      console.log(`From: ${fromEmail}`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`HTML Length: ${options.html.length} characters`);
      console.log('📧 To activate real emails, set SENDGRID_API_KEY environment variable');
      return true;
    }

    try {
      console.log(`📧 [SENDGRID] Attempting to send email to: ${options.to}`);
      console.log(`📧 [SENDGRID] Subject: ${options.subject}`);
      console.log(`📧 [SENDGRID] From: ${fromEmail}`);
      
      const msg = {
        to: options.to,
        from: fromEmail,
        subject: options.subject,
        html: options.html,
        // Enhanced deliverability headers
        replyTo: fromEmail,
        categories: ['waitlist', 'blue-tradie'],
        customArgs: {
          'campaign': 'waitlist-signup',
          'version': '1.0'
        },
        // Improved tracking and deliverability settings
        trackingSettings: {
          clickTracking: {
            enable: false
          },
          openTracking: {
            enable: false
          }
        },
        // Add CC for testing purposes when requested
        cc: process.env.TEST_CC_EMAIL ? [process.env.TEST_CC_EMAIL] : undefined
      };

      const response = await this.mailService!.send(msg);
      console.log(`📧 [SENDGRID SUCCESS] Email sent to ${options.to}`);
      console.log(`📧 [SENDGRID RESPONSE] Status: ${response[0]?.statusCode}, MessageId: ${response[0]?.headers?.['x-message-id']}`);
      const status = response[0]?.statusCode ?? 0;
if (status < 200 || status >= 300) {
  throw new Error(`SendGrid non-2xx status: ${status}`);
}

      // Track email usage
      const usageMonitor = UsageMonitor.getInstance();
      usageMonitor.trackEmail();
      
      return true;
    } catch (error) {
      console.error('📧 SendGrid email error:', error);
      return false;
    }
  }

  async sendTestEmail(to: string): Promise<boolean> {
    const subject = 'Blue Tradie Email System Test ✅';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Blue Tradie Email Test</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #ea580c; color: white; padding: 20px; text-align: center; border-radius: 8px; }
              .content { padding: 20px; background: #f9f9f9; margin-top: 20px; border-radius: 8px; }
              .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🎉 Blue Tradie Email Test</h1>
                  <p>Your email system is working perfectly!</p>
              </div>
              
              <div class="content">
                  <div class="success">
                      <strong>✅ Success!</strong> This test email confirms that SendGrid is properly configured and ready to send emails.
                  </div>
                  
                  <p><strong>Email Service Details:</strong></p>
                  <ul>
                      <li>Provider: SendGrid</li>
                      <li>From: ${this.defaultFrom}</li>
                      <li>Timestamp: ${new Date().toISOString()}</li>
                  </ul>
                  
                  <p>Your Blue Tradie platform is now ready to send tier-specific welcome emails, notifications, and other communications to your beta users.</p>
                  
                  <p style="color: #666; font-style: italic;">
                      This is an automated test message from the Blue Tradie email system.
                  </p>
              </div>
          </div>
      </body>
      </html>
    `;

    return this.sendEmail({ to, subject, html });
  }

  // Legacy tier welcome email method removed - now using waitlist automation system

  getServiceStatus() {
    const hasApiKey = !!(process.env.SENDGRID_API_KEY_BLUETRADIE || process.env.SENDGRID_API_KEY);
    return {
      isActive: !this.isTestMode,
      provider: 'SendGrid',
      testMode: this.isTestMode,
      fromEmail: this.defaultFrom,
      hasApiKey
    };
  }
}

// Legacy tier display function removed - now using waitlist automation system

// Export singleton instance
export const emailService = new SendGridEmailService();
