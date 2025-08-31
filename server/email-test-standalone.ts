// Standalone email test routes - no authentication required
import { Express } from 'express';

export function addStandaloneEmailTestRoutes(app: Express) {
  
  // Simple email test - no auth required
  app.post('/api/email-test/send', async (req, res) => {
    try {
      const { testEmail } = req.body;
      
      if (!testEmail) {
        return res.status(400).json({ 
          success: false, 
          message: "Test email address is required" 
        });
      }

      console.log(`📧 Email test requested for: ${testEmail}`);
      
      // Import SendGrid email service
      const { emailService } = await import('./services/sendgrid-email-service');
      const success = await emailService.sendTestEmail(testEmail);
      
      res.json({ 
        success, 
        message: success 
          ? "Test email sent successfully! Check your inbox." 
          : "Email send failed. System is in test mode - check console for details.",
        testMode: emailService.getServiceStatus().testMode,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Email test error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Email test failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Email service status - no auth required
  app.get('/api/email-test/status', async (req, res) => {
    try {
      const { emailService } = await import('./services/sendgrid-email-service');
      const serviceStatus = emailService.getServiceStatus();
      res.json({
        emailServiceActive: serviceStatus.isActive,
        testMode: serviceStatus.testMode,
        provider: serviceStatus.provider,
        timestamp: new Date().toISOString(),
        configuration: {
          hasSendGrid: serviceStatus.hasApiKey,
          fromEmail: serviceStatus.fromEmail
        }
      });
    } catch (error) {
      console.error("Email status check error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to check email status",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Welcome email test - no auth required
  app.post('/api/email-test/welcome', async (req, res) => {
    try {
      const { 
        testEmail, 
        tier = 'founding',
        firstName = 'Test',
        country = 'Australia',
        businessName = 'Test Tradie Business'
      } = req.body;
      
      if (!testEmail) {
        return res.status(400).json({ 
          success: false, 
          message: "Test email address is required" 
        });
      }

      const testUserData = {
        firstName,
        email: testEmail,
        tier: tier as 'founding' | 'earlySupporter' | 'betaTester',
        country,
        businessName
      };

      console.log(`📧 Testing welcome email for: ${tier} tier`);
      
      const { emailService } = await import('./services/sendgrid-email-service');
      const success = await emailService.sendTierWelcomeEmail(testUserData);
      
      res.json({ 
        success, 
        message: success 
          ? `${tier} tier welcome email sent successfully! Check your inbox.` 
          : "Welcome email send failed. System is in test mode - check console for details.",
        tierData: testUserData,
        testMode: emailService.getServiceStatus().testMode,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error("Welcome email test error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Welcome email test failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
}