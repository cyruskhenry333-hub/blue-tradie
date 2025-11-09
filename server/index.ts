/// <reference path="./types/express-session.d.ts" />
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { registerRoutes } from "./routes";
import { setupSimpleAuth } from "./simpleAuth";
import { setupVite, serveStatic, log } from "./vite";
import { domainRedirectMiddleware } from "./middleware/domain-redirect";
import { passwordGateMiddleware, handlePasswordGate } from "./middleware/password-gate";
import { addStandaloneEmailTestRoutes } from "./email-test-standalone";
import { initSentry, Sentry } from "./sentry";
import version from "./version.json";
import { mountStripeWebhook } from "./stripe-webhook";
import { mountSession } from "./session";
import authVerifyRouter from "./routes/auth-verify";
import { authUserRouter } from "./routes/auth-user";
import { onboardingRouter } from "./routes/onboarding";
import { adminUsersRouter } from "./routes/admin-users";

// Initialize Sentry before everything else
initSentry();

// Start automation worker (Bull queue processor)
import "./workers/automationWorker";

const app = express();

// ===== STEP 1: STRIPE WEBHOOK - MOUNT FIRST (before ANY other middleware) =====
mountStripeWebhook(app);

// ===== STEP 2: SESSION SETUP =====
mountSession(app);

// Sentry request handler 
if (process.env.SENTRY_DSN) {
  app.use(Sentry.expressErrorHandler());
}

// Domain redirect middleware temporarily disabled for troubleshooting
// app.use(domainRedirectMiddleware);

// ===== GLOBAL PARSERS THAT CAPTURE RAW BYTES =====
// Augment Express Request to carry rawBody
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

// Capture raw bytes for ANY incoming request before JSON/urlencoded parsing mutates req.body
const captureRaw = (req: any, _res: any, buf: Buffer) => {
  // Only keep for JSON requests (Stripe sends application/json)
  if (req.headers["content-type"]?.startsWith("application/json")) {
    req.rawBody = Buffer.from(buf);
  }
};

// Register parsers with verify hooks to capture raw buffer
app.use(express.json({ verify: captureRaw, limit: '10mb' }));
app.use(express.urlencoded({ verify: captureRaw, extended: false, limit: '10mb' }));

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

  // ===== AUTH ROUTES =====
  app.use('/', authVerifyRouter);
  app.use('/', authUserRouter);
  app.use('/', onboardingRouter);
  app.use('/', adminUsersRouter);

  // ===== TEMPORARY DEBUG ROUTE =====
  app.get('/api/auth/debug-session', (req, res) => {
    const cookieNames = Object.keys(req.cookies || {});
    const session = req.session as any;
    res.json({
      cookieNames,
      session: {
        userId: session?.userId,
        email: session?.email,
        passwordAuthenticated: session?.passwordAuthenticated,
        isOnboarded: session?.isOnboarded,
        keys: Object.keys(session || {})
      }
    });
  });

  // ===== LOGIN REDIRECT LOGIC =====
  app.get('/login', (req, res, next) => {
    const sess: any = (req as any).session;
    if (sess?.userId && sess?.passwordAuthenticated) {
      return res.redirect(sess.isOnboarded ? '/dashboard' : '/onboarding');
    }
    return next(); // let frontend serve the login page
  });
  
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
    <title>Blue Tradie - Login</title>
    <style>
        body { font-family: Arial, sans-serif; background: #f0f4f8; padding: 50px; margin: 0; }
        .login-box { max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #1e40af; text-align: center; margin-bottom: 30px; }
        input { width: 100%; padding: 12px; margin: 10px 0; border: 2px solid #e5e7eb; border-radius: 6px; font-size: 16px; box-sizing: border-box; }
        button { width: 100%; padding: 15px; background: #3b82f6; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: 600; cursor: pointer; margin-bottom: 10px; }
        button:hover { background: #2563eb; }
        button:disabled { background: #9ca3af; cursor: not-allowed; }
        .info { text-align: center; color: #666; font-size: 14px; margin-top: 20px; line-height: 1.4; }
        .error { background: #fee; border: 1px solid #fcc; color: #c66; padding: 10px; border-radius: 6px; margin-bottom: 20px; }
        .success { background: #efe; border: 1px solid #cfc; color: #6c6; padding: 10px; border-radius: 6px; margin-bottom: 20px; }
        .footer-links { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
        .footer-links a { color: #3b82f6; text-decoration: none; margin: 0 10px; font-size: 14px; }
        .footer-links a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="login-box">
        <h1><a href="/dashboard" style="text-decoration: none; color: inherit; cursor: pointer;">Blue Tradie</a></h1>
        
        <script>
        // Show error messages from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get('error');
        const errorMessages = {
          'missing_token': 'Login link is missing. Please request a new one.',
          'invalid_token': 'Invalid login link. Please request a new one.',
          'invalid_or_expired_token': 'Login link has expired or been used. Please request a new one.',
          'user_not_found': 'Account not found. Please check your email or sign up.',
          'session_error': 'Session error occurred. Please try again.',
          'session_failed': 'Failed to create session. Please try again.'
        };
        
        if (error && errorMessages[error]) {
          document.addEventListener('DOMContentLoaded', function() {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = errorMessages[error];
            document.querySelector('.login-box').insertBefore(errorDiv, document.querySelector('form'));
          });
        }
        </script>
        
        <form method="POST" action="/api/auth/request-login" onsubmit="handleMagicLinkSubmit(event)">
            <input type="email" name="email" placeholder="Enter your email address" required>
            <button type="submit">Send Login Link</button>
        </form>
        
        <div class="info">
            We'll send a secure login link to your email.<br>
            No passwords required!
        </div>
        
        <div class="footer-links">
            <a href="/">← Back to Home</a>
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
        </div>
        
        <script>
        async function handleMagicLinkSubmit(event) {
          event.preventDefault();
          const form = event.target;
          const email = form.email.value;
          const button = form.querySelector('button');
          
          button.disabled = true;
          button.textContent = 'Sending...';
          
          try {
            const response = await fetch('/api/auth/request-login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email })
            });
            
            const result = await response.json();
            
            if (response.ok) {
              // Show success message
              const successDiv = document.createElement('div');
              successDiv.className = 'success';
              successDiv.textContent = 'Login link sent! Check your email and click the link to sign in.';
              form.parentNode.insertBefore(successDiv, form);
              form.email.value = '';
            } else {
              // Show error message
              const errorDiv = document.createElement('div');
              errorDiv.className = 'error';
              errorDiv.textContent = result.message || 'Failed to send login link. Please try again.';
              form.parentNode.insertBefore(errorDiv, form);
            }
          } catch (error) {
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = 'Network error. Please check your connection and try again.';
            form.parentNode.insertBefore(errorDiv, form);
          } finally {
            button.disabled = false;
            button.textContent = 'Send Login Link';
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
// Demo auth routes (mount in all envs – code-only)
const previewDemoRoutes = await import('./routes/preview-demo-auth');
app.use('/', previewDemoRoutes.default);

// CRITICAL: Register essential API routes before OAuth-dependent routes
// This ensures signup/checkout works even if OAuth fails
const { registerEssentialApiRoutes } = await import('./routes');
await registerEssentialApiRoutes(app);

// Setup routes without Replit OAuth dependency
let server: any;
try {
  server = await registerRoutes(app);
} catch (err: any) {
  console.warn(
    '[BOOT] Auth setup failed; enabling demo auth in production. Reason:',
    err?.message ?? err
  );
  // Turn on the preview/demo auth routes even in production
  const previewDemoRoutes: any = await import('./routes/preview-demo-auth');
  app.use('/', previewDemoRoutes.default ?? previewDemoRoutes);

  // Create a plain HTTP server for the Express app
  const { createServer } = await import('node:http');
  server = createServer(app);
}

  // DEBUG: print effective routes at startup
  function listRoutes(app: any) {
    const routes: string[] = [];
    app._router?.stack?.forEach((l: any) => {
      if (l.route?.path) {
        routes.push(`${Object.keys(l.route.methods).join(",").toUpperCase()} ${l.route.path}`);
      }
      if (l.name === "router" && l.handle?.stack) {
        l.handle.stack.forEach((h: any) => {
          if (h.route?.path) {
            routes.push(`${Object.keys(h.route.methods).join(",").toUpperCase()} ${h.route.path}`);
          }
        });
      }
    });
    
    // Show all webhook routes specifically
    const webhookRoutes = routes.filter(r => r.includes('/stripe/webhook'));
    console.log("[ROUTES]", webhookRoutes.length > 0 ? webhookRoutes : routes.slice(0, 20));
  }
  listRoutes(app);

  // Stripe configuration logging
  const whsec = process.env.STRIPE_WEBHOOK_SECRET || "";
  const verifyDisabled = (process.env.STRIPE_VERIFY_DISABLED || "").toLowerCase() === "true";
  console.log("[STRIPE CONFIG]", {
    verifyDisabled,
    whsecPrefix: whsec ? whsec.substring(0, 8) + "..." : "MISSING"
  });

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
