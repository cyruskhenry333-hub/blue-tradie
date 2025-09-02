import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupSimpleAuth } from "./simpleAuth";
import { setupVite, serveStatic, log } from "./vite";
import { domainRedirectMiddleware } from "./middleware/domain-redirect";
import { passwordGateMiddleware, handlePasswordGate } from "./middleware/password-gate";
import { addStandaloneEmailTestRoutes } from "./email-test-standalone";
import { initSentry, Sentry } from "./sentry";
import version from "../version.json";

// Initialize Sentry before everything else
initSentry();

const app = express();

// Trust proxy for secure cookies behind proxy
app.set('trust proxy', 1);

// Sentry request handler must be the first middleware (only if Sentry is initialized)
if (process.env.SENTRY_DSN) {
  app.use(Sentry.expressErrorHandler());
}

// Domain redirect middleware temporarily disabled for troubleshooting
// app.use(domainRedirectMiddleware);

// Increase payload limits for file uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Note: Demo routes will be added after session setup

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Add standalone email test routes BEFORE auth setup
  addStandaloneEmailTestRoutes(app);
  
  // Add SendGrid debug route
  const sendgridDebug = await import('./routes/sendgrid-debug');
  app.use('/debug/sendgrid', sendgridDebug.default);
  
  // Setup simple auth for beta testing
  setupSimpleAuth(app);
  
  // Password gate route (must be before password gate middleware)
  app.get('/password-gate', handlePasswordGate);
  app.post('/password-gate', handlePasswordGate);
  
  // Apply password gate middleware to all routes (except API and assets)
  app.use(passwordGateMiddleware);
  
  // Apply onboarding gate middleware after password gate
  // Apply demo dashboard guard first (preview only)
  const { demoDashboardGuard } = await import('./middleware/demo-dashboard-guard');
  app.use(demoDashboardGuard);
  
  const { onboardingGateMiddleware } = await import('./middleware/onboarding-gate');
  app.use(onboardingGateMiddleware);
  
  // Add demo routes AFTER session setup but BEFORE other routes
  app.get('/demo-access', (req, res) => {
    console.log('[DEMO ACCESS] Serving demo access page');
    res.setHeader('Content-Type', 'text/html');
    res.send('<h1>Demo Access - Coming Soon</h1><p>Use /login instead</p>');
  });

  app.get('/simple-demo', (req, res) => {
    console.log('[SIMPLE DEMO] Serving simple demo page');
    res.setHeader('Content-Type', 'text/html');
    res.send('<h1>Simple Demo - Coming Soon</h1><p>Use /login instead</p>');
  });

  app.get('/login', (req, res) => {
    console.log('[LOGIN] Serving login page');
    res.setHeader('Content-Type', 'text/html');
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blue Tradie - Demo Login</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f0f4f8; padding: 50px; margin: 0; }
        .login-box { max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #1e40af; text-align: center; margin-bottom: 30px; }
        h2 { color: #1e40af; text-align: center; margin-bottom: 20px; font-size: 18px; }
        input { width: 100%; padding: 12px; margin: 10px 0; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 16px; box-sizing: border-box; }
        button { width: 100%; padding: 15px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; margin-bottom: 10px; }
        button:hover { background: #2563eb; }
        .demo-button { background: #16a34a; }
        .demo-button:hover { background: #15803d; }
        .info { text-align: center; color: #666; font-size: 14px; margin-top: 20px; }
        .divider { border-top: 1px solid #e5e7eb; margin: 30px 0; text-align: center; position: relative; }
        .divider::after { content: "OR"; background: white; padding: 0 15px; position: absolute; top: -10px; left: 50%; transform: translateX(-50%); color: #666; }
    </style>
</head>
<body>
    <div class="login-box">
        <h1>Blue Tradie Demo</h1>
        
        <h2>Standard Login</h2>
        <form method="POST" action="/test-login">
            <input type="text" name="username" placeholder="Username" value="cy" required>
            <input type="password" name="password" placeholder="Password" value="vip13" required>
            <button type="submit">Login to Blue Tradie Demo</button>
        </form>
        
        <div class="divider"></div>
        
        <h2>Demo Token Access</h2>
        <form method="POST" action="/auth/demo/verify" onsubmit="handleDemoSubmit(event)">
            <input type="text" name="code" placeholder="Paste demo code here" required>
            <button type="submit" class="demo-button">Verify Demo Code</button>
        </form>
        
        <div class="info">
            <strong>VIP Demo Account</strong><br>
            Australian Electrician with 200 AI tokens<br>
            Full platform access for testing<br><br>
            <strong>Demo Codes:</strong> DEMO2024, PREVIEW123, TEST456<br>
            <a href="/debug/session" target="_blank" style="color: #3b82f6;">Debug Session</a>
        </div>
        
        <script>
        async function handleDemoSubmit(event) {
          event.preventDefault();
          const form = event.target;
          const formData = new FormData(form);
          
          try {
            const response = await fetch('/auth/demo/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: formData.get('code') })
            });
            
            const result = await response.json();
            
            if (result.success) {
              window.location.href = result.redirectTo || '/onboarding';
            } else {
              alert('Invalid demo code: ' + (result.error || 'Unknown error'));
            }
          } catch (error) {
            alert('Demo verification failed: ' + error.message);
          }
        }
        </script>
    </div>
</body>
</html>
    `);
  });

  // Redirect root to login for easy testing
  app.get('/test', (req, res) => {
    console.log('[TEST] Redirecting to login page');
    res.redirect('/login');
  });

  // Quick demo access page (no passwords needed)
  app.get('/quick', (req, res) => {
    console.log('[QUICK DEMO] Serving quick demo page');
    res.sendFile(path.join(process.cwd(), 'quick-demo.html'));
  });

  // Email preview page for template visualization
  app.get('/email-preview.html', (req, res) => {
    console.log('[EMAIL PREVIEW] Serving email template preview');
    res.sendFile(path.join(process.cwd(), 'email-preview.html'));
  });

  // Success page preview - shows the complete user experience
  app.get('/success-page-preview.html', (req, res) => {
    console.log('[SUCCESS PREVIEW] Serving success page preview');
    res.sendFile(path.join(process.cwd(), 'success-page-preview.html'));
  });

  // Welcome email live demo - functional email with working magic button
  app.get('/welcome-email-live.html', (req, res) => {
    console.log('[WELCOME EMAIL LIVE] Serving live welcome email demo');
    res.sendFile(path.join(process.cwd(), 'welcome-email-live.html'));
  });

  // Manual email trigger for debugging
  app.post('/api/manual-welcome-email', async (req, res) => {
    try {
      const { email } = req.body;
      console.log(`[MANUAL EMAIL] Sending welcome email to ${email}`);
      
      // Get user from database  
      const { db } = await import('./db');
      const { waitlist } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');
      const userEntry = await db.select().from(waitlist).where(eq(waitlist.email, email)).limit(1);
      if (userEntry.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Send welcome email using the same method as waitlist service
      const { SendGridEmailService } = await import('./services/sendgrid-email-service');
      const emailService = new SendGridEmailService();
      const { vipSignUpFlowLockedAug2025 } = await import('./services/vip-signup-flow-locked-aug2025');
      
      const greeting = userEntry[0].country === "New Zealand" ? "Hey bro" : "G'day mate";
      const welcomeEmailHtml = vipSignUpFlowLockedAug2025.generateWelcomeEmail(userEntry[0]);
      
      await emailService.sendEmail({
        to: userEntry[0].email,
        subject: '🔧 Welcome to Blue Tradie - You\'re In!',
        html: welcomeEmailHtml
      });
      
      console.log(`[MANUAL EMAIL] Welcome email sent to ${email}`);
      res.json({ success: true, message: 'Welcome email sent successfully' });
    } catch (error) {
      console.error('[MANUAL EMAIL] Error:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });



  // Instant login routes - no forms, just click and go!
  app.get('/instant-cy', (req, res) => {
    // Generate fresh user ID to ensure welcome card shows
    const freshUserId = `cy-vip-user-${Date.now()}`;
    (req.session as any).testUser = {
      id: freshUserId, firstName: 'Cy', lastName: 'User', email: 'cy@bluetradie.com', 
      country: 'Australia', trade: 'Electrician', businessName: 'Cy Electrical Services',
      profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cy',
      tokenBalance: 200, subscriptionTier: 'VIP Demo Access',
      isOnboarded: false, // Allow onboarding for testing
      serviceArea: 'Sydney Metro', // Add required fields
      isGstRegistered: true
    };
    (req.session as any).isTestAuthenticated = true;
    console.log(`[INSTANT] CY user logged in with fresh ID: ${freshUserId}`);
    res.redirect('/');
  });



  app.get('/instant-demo', (req, res) => {
    // Generate fresh user ID to ensure welcome card shows
    const freshUserId = `demo-user-${Date.now()}`;
    (req.session as any).testUser = {
      id: freshUserId, firstName: 'Demo', lastName: 'User', email: 'demo@bluetradie.com',
      country: 'Australia', trade: 'Electrician', businessName: 'Demo Electrical Services',
      profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      tokenBalance: 200, subscriptionTier: 'Blue Lite Demo',
      isOnboarded: false, // Allow onboarding for testing
      serviceArea: 'Melbourne', // Add required fields
      isGstRegistered: true
    };
    (req.session as any).isTestAuthenticated = true;
    console.log(`[INSTANT] Demo user logged in with fresh ID: ${freshUserId}`);
    res.redirect('/');
  });

  app.get('/instant-test', (req, res) => {
    // Generate fresh user ID to ensure welcome card shows
    const freshUserId = `test-user-${Date.now()}`;
    (req.session as any).testUser = {
      id: freshUserId, firstName: 'Test', lastName: 'Tradie', email: 'test@bluetradie.com',
      country: 'Australia', trade: 'Plumber', businessName: 'Test Plumbing Co',
      profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
      tokenBalance: 200, subscriptionTier: 'Blue Lite Demo',
      isOnboarded: false, // Allow onboarding for testing
      serviceArea: 'Brisbane', // Add required fields
      isGstRegistered: true
    };
    (req.session as any).isTestAuthenticated = true;
    console.log('[INSTANT] Test user logged in');
    res.redirect('/');
  });

  // Handle login form submission
  app.post('/test-login', (req, res) => {
    console.log('[TEST LOGIN] Processing login:', req.body);
    const { username, password } = req.body;
    
    if (username === 'cy' && password === 'vip13') {
      // Set session data for demo user
      (req.session as any).demoUser = {
        id: 'cy',
        username: 'cy',
        email: 'cy@demo.com',
        firstName: 'Cy',
        lastName: 'Demo',
        country: 'AU',
        trade: 'Electrician',
        tokens: 200
      };
      console.log('[TEST LOGIN] Demo user authenticated, redirecting to app');
      res.redirect('/');
    } else {
      console.log('[TEST LOGIN] Invalid credentials');
      res.redirect('/login?error=invalid');
    }
  });

  // HARD GATE: Demo dashboard guard - preview only
  app.get('/demo', async (req, res) => {
    const isPreview = process.env.NODE_ENV !== 'production';
    
    if (!isPreview) {
      return res.status(403).json({ error: 'Demo dashboard not available in production' });
    }

    // CRITICAL: Check session mode and org
    if (req.session?.mode !== 'demo' || req.session?.currentOrgId !== 'demo-org-default') {
      console.log(`[DEMO GUARD] Access denied - mode: ${req.session?.mode}, orgId: ${req.session?.currentOrgId}`);
      return res.status(403).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Demo Access Required</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
          <h1 style="color: #dc2626;">Demo Access Required</h1>
          <p>You must be authenticated in demo mode to access this page.</p>
          <a href="/login" style="color: #3b82f6; text-decoration: underline;">Go to Login</a>
        </body>
        </html>
      `);
    }

    // Demo dashboard access granted
    console.log(`[DEMO GUARD] Access granted - user: ${req.session.testUser?.id}, org: ${req.session.currentOrgId}`);
    res.redirect('/demo-dashboard');
  });

  // Legacy demo routes redirect to login
  app.get('/demo-dashboard', (req, res) => {
    const isPreview = process.env.NODE_ENV !== 'production';
    
    if (!isPreview || req.session?.mode !== 'demo') {
      return res.redirect('/login');
    }
    
    // Redirect to main dashboard - this will trigger onboarding gate if needed
    res.redirect('/');
  });
  // Environment variables
  process.env.PREVIEW_DISABLE_MAGIC_LINKS = 'true';
  
  // Preview-only demo auth routes
if (process.env.ENABLE_DEMO_ROUTES === 'true') {
  const previewDemoRoutes = await import('./routes/preview-demo-auth');
  app.use('/', previewDemoRoutes.default);
}

let server: any;
try {
  // Only try full auth if all Replit OAuth env vars exist
  if (
    process.env.REPLIT_CLIENT_ID &&
    process.env.REPLIT_CLIENT_SECRET &&
    process.env.REPLIT_REDIRECT_URI &&
    process.env.REPLIT_DOMAINS
  ) {
    server = await registerRoutes(app);
  } else {
    throw new Error('Replit OAuth env not set');
  }
} catch (err: any) {
  console.warn(
    '[BOOT] Auth setup failed or not configured; enabling demo auth in production. Reason:',
    err?.message ?? err
  );
  // Turn on the preview/demo auth routes even in production
  const previewDemoRoutes: any = await import('./routes/preview-demo-auth');
  app.use('/', previewDemoRoutes.default ?? previewDemoRoutes);

  // Create a plain HTTP server for the Express app
  const { createServer } = await import('node:http');
  server = createServer(app);
}

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
