/**
 * VIP Sign-Up Flow – Transactional Version
 * 
 * TRANSACTIONAL EMAIL TEMPLATES FOR BETTER DELIVERABILITY
 * 
 * This file contains transactional versions of the Blue Tradie automation flow emails
 * to improve Gmail deliverability by removing promotional content.
 * 
 * Created: August 7, 2025
 * Status: TESTING
 */

export interface TransactionalEmailTemplates {
  generateWelcomeEmail(entry: any, greeting: string): string;
  generateDemoAccessEmail(entry: any, demoCode: string): string;
  generateDay7FollowUpEmail(userName: string): string;
  generateDay14VideoRequestEmail(userName: string): string;
}

class VIPSignUpFlowTransactional implements TransactionalEmailTemplates {
  
  /**
   * TRANSACTIONAL TEMPLATE 1: Welcome Email
   * Features: Account confirmation messaging, no promotional content
   */
  generateWelcomeEmail(entry: any, greeting: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Blue Tradie Account Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px; }
        .content { padding: 20px; background: #f8f9fa; margin-top: 20px; border-radius: 8px; }
        .info-section { background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
        .cta-section { background: #1e40af; color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .cta-section h3 { color: white; }
        .cta-section p { color: white; }
        .features-list { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
        .button { 
            display: inline-block; 
            background: #f97316; 
            color: white !important; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            font-weight: bold;
            margin: 10px 0;
        }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        ul { padding-left: 20px; }
        li { margin: 8px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Blue Tradie Account Confirmation</h2>
            <p>Registration Successful ${entry.country === "New Zealand" ? "🇳🇿" : "🇦🇺"}</p>
        </div>
        
        <div class="content">
            <p>Hi ${entry.firstName || 'there'},</p>
            
            <p>Your Blue Tradie account has been successfully created and confirmed.</p>
            
            <div class="info-section">
                <h3>Account Details</h3>
                <ul>
                    <li><strong>Name:</strong> ${entry.firstName || 'User'} ${entry.lastName || ''}</li>
                    <li><strong>Email:</strong> ${entry.email}</li>
                    <li><strong>Trade:</strong> ${entry.trade || 'Tradie'}</li>
                    <li><strong>Region:</strong> ${entry.country || 'Australia'}</li>
                    <li><strong>Status:</strong> Early Access Program</li>
                </ul>
            </div>
            
            <div class="features-list">
                <h3>Platform Features Available</h3>
                <ul>
                    <li>AI business advisors for accounting, marketing, and legal guidance</li>
                    <li>Invoice management with GST compliance</li>
                    <li>Expense tracking and categorization</li>
                    <li>Job management and customer records</li>
                    <li>Goal setting and progress tracking</li>
                    <li>Vision board creation tools</li>
                </ul>
            </div>
            
            <div class="cta-section">
                <h3 style="color: white;">Next Step: Activate Demo Access</h3>
                <p style="color: white;">To access your demo account, click the button below:</p>
                
                <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                    <tr>
                        <td style="background: #f97316; border-radius: 6px; text-align: center; padding: 0;">
                            <a href="${process.env.APP_BASE_URL || 'https://bluetradie.com'}/api/waitlist/request-early-access?email=${encodeURIComponent(entry.email)}" 
                               style="display: inline-block; padding: 12px 24px; color: white !important; background: #f97316; border: none; font-weight: bold; text-decoration: none; border-radius: 6px;">
                                Activate Demo Access
                            </a>
                        </td>
                    </tr>
                </table>
                
                <p style="color: white; font-size: 14px; margin-top: 15px;">
                    After clicking, your demo credentials will be sent to this email address.
                </p>
            </div>
            
            <div class="info-section">
                <h4>Demo Account Information</h4>
                <p>Your demo provides 14 days of full access to test all platform features. A brief user feedback video is requested at the end of the trial period.</p>
            </div>
            
            <p>This email confirms your registration in the Blue Tradie early access program.</p>
            
            <p>If you have any questions, reply to this email.</p>
            
            <p>Best regards,<br>
            <strong>Blue Tradie Support Team</strong><br>
            <em>Business management for ${entry.country === "New Zealand" ? "New Zealand" : "Australian"} tradies</em></p>
        </div>
        
        <div class="footer">
            <p>Blue Tradie | Business Management Platform</p>
            <p>This email was sent to ${entry.email}</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * LOCKED TEMPLATE 2: Demo Access Email (unchanged - already transactional)
   */
  generateDemoAccessEmail(entry: any, demoCode: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>🚀 Your Blue Tradie Demo Access is Ready</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 30px 20px; text-align: center; border-radius: 12px; margin-bottom: 20px; }
        .content { background: white; padding: 30px; border-radius: 12px; }
        .demo-code { background: #22c55e; color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 20px 0; }
        .instructions { background: #e0f2fe; padding: 25px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
        .button { 
            display: inline-block; 
            background: #ea580c; 
            color: white !important; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 8px; 
            margin: 15px 0; 
            font-weight: bold;
            font-size: 16px;
        }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .features { background: #fef3c7; padding: 25px; border-radius: 12px; margin: 20px 0; }
        .beta-note { background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
        .support-box { background: #fef2f2; padding: 20px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Your Blue Tradie Demo Access is Ready</h1>
            <p>Let's Go! You're officially in the early access group.</p>
        </div>
        
        <div class="content">
            <p>G'day ${entry.firstName || 'there'}!</p>
            <p>You're in! Your early access to Blue Tradie is now live.</p>
            
            <div class="demo-code">
                <h3>🔓 Your Demo Code</h3>
                <h2 style="font-size: 28px; margin: 10px 0; color: #dc2626;">${demoCode}</h2>
                <p style="margin: 5px 0;">Keep this handy - you'll need it to jump in!</p>
            </div>

            <div class="instructions">
                <h3>🚀 How to Get Started</h3>
                <ol>
                    <li><strong>Visit:</strong> <a href="${process.env.APP_BASE_URL || 'https://bluetradie.com'}/demo">Blue Tradie Demo Platform</a></li>
                    <li><strong>Enter your demo code:</strong> ${demoCode}</li>
                    <li><strong>Start exploring!</strong> All features are unlocked</li>
                </ol>
                
                <div style="text-align: center; margin: 20px 0;">
                    <a href="${process.env.APP_BASE_URL || 'https://bluetradie.com'}/demo" class="button">
                        🚀 Launch Blue Tradie Demo
                    </a>
                </div>
            </div>

            <div class="features">
                <h3>🎯 What You Get</h3>
                <ul>
                    <li>✅ <strong>1,000,000 AI tokens</strong> - Real conversations with your AI business team</li>
                    <li>✅ <strong>14 days full access</strong> - All features unlocked</li>
                    <li>✅ <strong>Personalized for ${entry.country}</strong> - Built for Aussie/Kiwi tradies</li>
                    <li>✅ <strong>Early feedback shapes the future</strong> - Your input matters</li>
                </ul>
            </div>

            <div class="support-box">
                <p><strong>Questions or issues?</strong></p>
                <p>Just reply to this email — we read every single one and respond fast.</p>
            </div>
            
            <p>Thanks again for being one of the first — your feedback is shaping the future of tradie tech.</p>
            
            <p>Cheers,<br>
            <strong>The Blue Tradie Team</strong><br>
            <em>Built by tradies, for tradies 🇦🇺🇳🇿</em></p>
        </div>
        
        <div class="footer">
            <p>Blue Tradie | Your demo expires in 14 days - make the most of it!</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * LOCKED TEMPLATE 3: Day 7 Follow-up Email (unchanged)
   */
  generateDay7FollowUpEmail(userName: string): string {
    return `Day 7 email template - keeping original for now`;
  }

  /**
   * LOCKED TEMPLATE 4: Day 14 Video Request Email (unchanged)
   */
  generateDay14VideoRequestEmail(userName: string): string {
    return `Day 14 email template - keeping original for now`;
  }
}

export const vipSignUpFlowTransactional = new VIPSignUpFlowTransactional();