import express from 'express';
import { DemoTokenService } from '../services/demo-token-service';

const router = express.Router();

// Secure demo token verification endpoint
router.get('/verify-demo/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const requestHost = req.get('host') || 'unknown';
    
    if (!token) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invalid Demo Link</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
            .error { color: #dc2626; font-size: 48px; margin-bottom: 20px; }
            h1 { color: #dc2626; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">❌</div>
            <h1>Invalid Demo Link</h1>
            <p>This demo access link is invalid or missing required information.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Verify token using secure service
    const verification = await DemoTokenService.verifyDemoToken(token, requestHost);
    
    if (!verification.success) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Demo Link Expired</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
            .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
            .error { color: #dc2626; font-size: 48px; margin-bottom: 20px; }
            h1 { color: #dc2626; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">⏰</div>
            <h1>Demo Link Expired</h1>
            <p>${verification.error || 'This demo access link has expired or is no longer valid.'}</p>
            <p>Please request a new demo link from our website.</p>
          </div>
        </body>
        </html>
      `);
    }

    // Set secure session with proper cookie scope
    const environment = process.env.NODE_ENV || 'development';
    const isProduction = environment === 'production';
    
    // Set demo user session with organization context
    req.session.testUser = verification.user;
    req.session.isTestAuthenticated = true;
    req.session.currentOrgId = verification.organizationId;
    
    // Set secure cookie options based on environment
    req.session.cookie.secure = isProduction;
    req.session.cookie.httpOnly = true;
    req.session.cookie.sameSite = 'lax';
    
    // Environment-specific domain setting
    if (isProduction) {
      req.session.cookie.domain = '.bluetradie.com';
    }
    // For preview: omit domain (host-only cookie)
    
    console.log(`[DEMO VERIFY] User ${verification.user?.id} authenticated for org ${verification.organizationId} in ${environment}`);
    
    // Set response headers for debugging
    res.setHeader('X-Demo-Auth', 'success');
    res.setHeader('X-Org-Id', verification.organizationId || 'unknown');
    
    // CRITICAL: Redirect to /onboarding (enforce onboarding for fresh demo users)
    res.redirect('/onboarding');

  } catch (error) {
    console.error('[DEMO VERIFY] Error processing demo verification:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demo Access Error</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; }
          .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
          .error { color: #dc2626; font-size: 48px; margin-bottom: 20px; }
          h1 { color: #dc2626; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="error">🔧</div>
          <h1>Demo Access Error</h1>
          <p>Something went wrong processing your demo access.</p>
          <p>Please try again or contact support.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// Legacy demo code endpoint (redirects to new system)
router.get('/demo/:token', async (req, res) => {
  const { token } = req.params;
  res.redirect(`/verify-demo/${token}`);
});

export default router;