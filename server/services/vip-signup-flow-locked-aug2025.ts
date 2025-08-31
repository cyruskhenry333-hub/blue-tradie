/**
 * VIP Sign-Up Flow – LOCKED PRODUCTION TEMPLATES (August 2025)
 * 
 * PRODUCTION-READY EMAIL SYSTEM - DO NOT MODIFY
 * 
 * This file contains the finalized, locked email templates for the Blue Tradie
 * VIP signup system. These templates have been tested and verified for:
 * - Gmail deliverability (transactional messaging)
 * - Clean, minimal styling
 * - Proper demo code integration
 * - Sequential user journey
 * 
 * Created: August 7, 2025
 * Status: LOCKED FOR PRODUCTION USE
 * Template Count: 3 emails
 * 
 * MODIFICATION POLICY: Changes to these templates require explicit approval
 * and comprehensive testing across all email providers.
 */

export interface LockedVIPEmailTemplates {
  generateWelcomeEmail(entry: any): string;
  generateDay7FollowUpEmail(entry: any): string;
  generateDay14VideoRequestEmail(entry: any): string;
}

class VIPSignUpFlowLockedAug2025 implements LockedVIPEmailTemplates {
  
  /**
   * EMAIL 1: Welcome & Demo Access (LOCKED TEMPLATE)
   * 
   * Purpose: Account confirmation with inline demo instructions
   * Deliverability: Transactional tone for Gmail compatibility
   * Content: VIP status, 100-user target, video requirement, demo steps
   */
  generateWelcomeEmail(entry: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Blue Tradie VIP Signup Confirmed</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.5; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .info-box { background: #e0f2fe; padding: 15px; margin: 15px 0; border-left: 3px solid #0ea5e9; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>VIP Signup Confirmed</h2>
            <p>Blue Tradie Early Access</p>
        </div>
        
        <div class="content">
            <p>Hi ${entry.firstName || 'there'},</p>
            
            <p>Your VIP signup for Blue Tradie has been confirmed.</p>
            
            <div class="info-box">
                <p><strong>Current Status:</strong> We're waiting to reach 100 VIP signups before the official launch.</p>
                <p><strong>Early Access Option:</strong> You can unlock immediate access by submitting a 90-second user experience video after trying the platform.</p>
            </div>
            
            <div class="info-box">
                <h4>Demo Access Instructions</h4>
                <p><strong>Step 1:</strong> Visit <a href="https://www.bluetradie.com">www.bluetradie.com</a></p>
                <p><strong>Step 2:</strong> Use demo code: <strong>${entry.demoCode || 'VIP001'}</strong></p>
                <p><strong>Step 3:</strong> Test the platform for 14 days</p>
                <p><strong>Step 4:</strong> Send your 90-second experience video to support@bluetradie.com</p>
            </div>
            
            <p>Questions? Reply to this email.</p>
            
            <p>Best regards,<br>Blue Tradie Team</p>
        </div>
        
        <div class="footer">
            <p>Blue Tradie | ${entry.email}</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * EMAIL 2: Day 7 Follow-up (LOCKED TEMPLATE)
   * 
   * Purpose: Check-in and feedback collection
   * Deliverability: Simple transactional follow-up
   * Content: Experience inquiry, feature feedback request
   */
  generateDay7FollowUpEmail(entry: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Blue Tradie Day 7 Check-In</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.5; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Day 7 Check-In</h2>
            <p>How's your Blue Tradie experience?</p>
        </div>
        
        <div class="content">
            <p>Hi ${entry.firstName || 'there'},</p>
            
            <p>It's been a week since you started with Blue Tradie. How are you finding the platform?</p>
            
            <p>We'd love to hear:</p>
            <ul>
                <li>What features are you using most?</li>
                <li>Any challenges or questions?</li>
                <li>What would make it more useful for your business?</li>
            </ul>
            
            <p>Just reply to this email with a quick update. Your feedback helps us improve the platform for all tradies.</p>
            
            <p>Thanks for being part of our early access group.</p>
            
            <p>Cheers,<br>Blue Tradie Team</p>
        </div>
        
        <div class="footer">
            <p>Blue Tradie | ${entry.email}</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * EMAIL 3: Day 14 Video Request (LOCKED TEMPLATE)
   * 
   * Purpose: Final trial completion and video collection
   * Deliverability: Simple text-based request
   * Content: Trial ending notice, video submission instructions
   */
  generateDay14VideoRequestEmail(entry: any): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Blue Tradie Day 14 - Video Request</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.5; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 500px; margin: 0 auto; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .video-info { background: #fef3c7; padding: 15px; margin: 15px 0; border-left: 3px solid #f59e0b; }
        .footer { text-align: center; font-size: 12px; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Day 14 - Final Check-In</h2>
            <p>Your Blue Tradie trial is ending</p>
        </div>
        
        <div class="content">
            <p>Hi ${entry.firstName || 'there'},</p>
            
            <p>Your 14-day Blue Tradie trial is coming to an end. We hope you've found it useful for your business.</p>
            
            <div class="video-info">
                <h4>90-Second Video Request</h4>
                <p>As part of our early access program, we'd appreciate a quick 90-second video sharing your experience.</p>
                <p><strong>Send your video to:</strong> support@bluetradie.com</p>
                <p><strong>What to include:</strong> What you liked, what could be improved, and whether you'd recommend it to other tradies.</p>
            </div>
            
            <p>Your feedback helps us build a better platform for the tradie community.</p>
            
            <p>Thanks for being an early adopter.</p>
            
            <p>Cheers,<br>Blue Tradie Team</p>
        </div>
        
        <div class="footer">
            <p>Blue Tradie | ${entry.email}</p>
        </div>
    </div>
</body>
</html>`;
  }
}

/**
 * PRODUCTION INSTANCE - DO NOT MODIFY
 * 
 * This exported instance is used by the waitlist service for all production emails.
 * Any changes to email content should be made by creating a new template file
 * rather than modifying this locked version.
 */
export const vipSignUpFlowLockedAug2025 = new VIPSignUpFlowLockedAug2025();

/**
 * TEMPLATE METADATA
 */
export const templateMetadata = {
  name: "VIP Sign-Up Flow – Locked Production Templates (August 2025)",
  version: "1.0.0",
  created: "2025-08-07",
  status: "LOCKED",
  emailCount: 3,
  deliverabilityTested: true,
  providers: ["Gmail", "Hotmail", "Outlook"],
  modifications: "Require explicit approval and testing"
};