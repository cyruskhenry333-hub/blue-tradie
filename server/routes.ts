import type { Express } from "express";
import { createServer, type Server } from "http";

import path from "path";
import { fileURLToPath } from "url";
import { storage } from "./storage";

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { setupAuth, isAuthenticated } from "./replitAuth";
import { unifiedAuth } from "./unifiedAuth";
import { demoService } from "./services/demo-service";
import { AITokenService } from "./services/ai-token-service";
import { isSimpleAuthenticated } from "./simpleAuth";
import { getUserOr401 } from "./utils/assertUser";
import UsageMonitor from "./middleware/usage-monitor";
import RateLimiter from "./middleware/rate-limiter";
import { getChatResponse, generateInvoiceContent, generateLogoConcept } from "./services/openai";
import { JourneyTracker } from "./services/journeyTracker";
// Removed legacy welcome-email import - now using waitlist automation system
import { trialService } from "./services/trialService";
// Removed legacy emailService import - now using sendgrid-email-service
import { aiService } from "./services/aiService";
import { insertJobSchema, insertInvoiceSchema, insertExpenseSchema, insertChatMessageSchema, insertTestimonialSchema, insertRoadmapItemSchema, insertFeatureRequestSchema, insertWaitlistEntrySchema } from "@shared/schema";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { invoices, chatMessages, feedbackSubmissions } from "@shared/schema";
import { registerAnalyticsRoutes } from "./routes/analytics";
import { registerDemoRoutes } from "./routes/demo-routes";
import { registerStripeWebhookRoutes } from "./routes/stripe-webhook";
import { registerSubscriptionRoutes } from "./routes/subscriptions";
import { registerInvoiceRoutes } from "./routes/invoice-routes";
import { registerHealthRoutes } from "./routes/health";
import { registerClientPortalRoutes } from "./routes/client-portal";
import Stripe from "stripe";

let stripe: Stripe | null = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('Warning: STRIPE_SECRET_KEY not found. Payment functionality will be disabled.');
}

// Essential API routes that must work even without OAuth setup
export function registerEssentialApiRoutes(app: Express): void {
  // New Stripe checkout route for free month trial with payment capture
  app.post('/api/checkout/start-trial', async (req, res) => {
    try {
      const {
        firstName,
        lastName, 
        email,
        businessName,
        trade,
        serviceArea,
        country,
        isGstRegistered,
        plan = 'pro' // Default to pro plan
      } = req.body;

      // Basic validation
      if (!firstName || !lastName || !email || !businessName || !trade || !serviceArea || !country) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Validate plan
      if (!['pro', 'teams'].includes(plan)) {
        return res.status(400).json({ message: "Invalid plan selected" });
      }

      // Generate user ID for later use
      const userId = `user-${email.replace(/[@.]/g, '-')}`;
      
      // TODO: Re-enable user existence check when database is properly configured
      // const existingUser = await storage.getUser(userId);
      // if (existingUser) {
      //   return res.status(400).json({ message: "An account with this email already exists" });
      // }

      // Store user data temporarily in session for after Stripe checkout
      req.session.pendingUser = {
        userId,
        firstName,
        lastName,
        email,
        businessName,
        trade,
        serviceArea,
        country,
        isGstRegistered: isGstRegistered || false,
        plan
      };

      // Get price ID from environment (with fallback for testing)
      const priceId = plan === 'pro' 
        ? (process.env.STRIPE_PRICE_PRO_MONTH || 'price_1SBDgoBNVpg7WCq0mAstv9mF')
        : (process.env.STRIPE_PRICE_TEAMS_MONTH || 'price_1SBDgpBNVpg7WCq0ivdj2fkc');
      
      if (!priceId) {
        return res.status(500).json({ message: "Pricing not configured. Please contact support." });
      }

      // Create Stripe checkout session with 30-day trial
      const stripe = await import('stripe');
      const stripeClient = new stripe.default(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-07-30.basil',
      });

      const session = await stripeClient.checkout.sessions.create({
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          trial_period_days: 30,
        },
        customer_email: email,
        success_url: `${process.env.APP_BASE_URL || 'https://blue-tradie.onrender.com'}/welcome?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.APP_BASE_URL || 'https://blue-tradie.onrender.com'}/signup?plan=${plan}`,
        metadata: {
          userId,
          plan,
          firstName,
          lastName,
          businessName,
          trade,
          serviceArea,
          country,
        }
      });

      console.log(`[STRIPE] Created checkout session for ${email} - plan: ${plan}`);
      res.json({ sessionUrl: session.url });
      
    } catch (error) {
      console.error('[STRIPE] Checkout error:', error);
      res.status(500).json({ 
        message: "Failed to create checkout session. Please try again.",
        error: (error as Error).message, // Always show error for debugging
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Anti-indexing middleware for all routes during testing
  app.use((req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet, noimageindex');
    next();
  });

  // DEMO ACCESS ROUTES - Limited to First 100 users only
  app.get('/demo', async (req, res) => {
    try {
      // Check if demo is still available for first 100 users
      const { waitlistService } = await import("./services/waitlist-service");
      const totalDemoUsers = 100; // First 100 limit reached
      
      if (totalDemoUsers >= 100) {
        // Demo is full - redirect to waitlist signup
        return res.redirect('/waitlist?demo=full');
      }
      
      // Auto-login as demo user and redirect to dashboard
      (req.session as any).testUser = {
        id: 'demo-user-001', 
        firstName: 'Demo', 
        lastName: 'User', 
        email: 'demo@bluetradie.com', 
        country: 'Australia', 
        trade: 'Electrician',
        businessName: 'Demo Electrical Services',
        profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        tokenBalance: 200,
        subscriptionTier: 'Blue Lite Demo'
      };
      (req.session as any).isTestAuthenticated = true;
      console.log('[DEMO] Auto-logged in demo user');
      res.redirect('/demo-dashboard');
    } catch (error) {
      console.error('[DEMO] Error checking demo availability:', error);
      res.redirect('/waitlist?demo=error');
    }
  });

  // Make root route also work for instant demo access
  app.get('/instant-demo', async (req, res) => {
    // Generate fresh demo user ID each time to ensure welcome card shows
    const freshUserId = `demo-user-${Date.now()}`;
    // Auto-login as demo user and redirect to dashboard
    (req.session as any).testUser = {
      id: freshUserId, 
      firstName: 'Demo', 
      lastName: 'User', 
      email: 'demo@bluetradie.com', 
      country: 'Australia', 
      trade: 'Electrician',
      businessName: 'Demo Electrical Services',
      profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      tokenBalance: 200,
      subscriptionTier: 'Blue Lite Demo',
      isOnboarded: false // Start fresh for onboarding testing
    };
    (req.session as any).isTestAuthenticated = true;
    console.log(`[INSTANT DEMO] Auto-logged in fresh demo user: ${freshUserId}`);
    res.redirect('/demo-dashboard');
  });

  // Simple demo login form that auto-submits to demo dashboard
  app.get('/test-demo', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>Blue Tradie Demo Access</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; padding: 40px; background: #f0f4f8; margin: 0; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 15px; box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
        h1 { color: #1e40af; text-align: center; margin-bottom: 20px; font-size: 28px; }
        .subtitle { text-align: center; color: #666; margin-bottom: 30px; }
        .btn { 
            width: 100%; padding: 18px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); 
            color: white; border: none; border-radius: 10px; font-size: 18px; font-weight: 600;
            cursor: pointer; margin: 15px 0; transition: all 0.3s ease; 
        }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(59, 130, 246, 0.3); }
        .info { text-align: center; color: #666; font-size: 14px; margin-top: 25px; line-height: 1.5; }
        .status { background: #d1fae5; color: #065f46; padding: 10px; border-radius: 8px; margin: 20px 0; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Blue Tradie Demo</h1>
        <p class="subtitle">AI-Powered Business Management for Tradespeople</p>
        <div class="status">✅ Demo ready - all systems operational</div>
        <button class="btn" onclick="accessDemo()">Launch Demo Dashboard</button>
        <div class="info">
            This will automatically log you in as a demo user with:<br>
            • 200 AI tokens ready for testing<br>
            • Full access to all platform features<br>
            • Realistic demo data and scenarios
        </div>
    </div>
    <script>
        function accessDemo() {
            console.log('Accessing demo dashboard...');
            window.location.href = '/demo';
        }
    </script>
</body>
</html>
    `);
  });

  // Serve the demo access page as static HTML
  app.get('/demo-access', (req, res) => {
    res.sendFile(path.join(__dirname, '../demo-access.html'));
  });

  // Serve demo admin interface FIRST to avoid route conflicts
  app.get('/demo-admin', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Demo User Management - Blue Tradie</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #1e40af, #3b82f6);
            color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .card {
            background: white;
            padding: 25px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-bottom: 25px;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #374151;
        }
        input, select, textarea {
            width: 100%;
            padding: 10px;
            border: 2px solid #e5e7eb;
            border-radius: 5px;
            font-size: 14px;
            transition: border-color 0.3s;
            box-sizing: border-box;
        }
        input:focus, select:focus, textarea:focus {
            outline: none;
            border-color: #3b82f6;
        }
        .btn {
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: background-color 0.3s;
        }
        .btn:hover {
            background: #2563eb;
        }
        .btn-success {
            background: #10b981;
        }
        .btn-success:hover {
            background: #059669;
        }
        .result {
            margin-top: 15px;
            padding: 15px;
            border-radius: 5px;
            display: none;
        }
        .result.success {
            background: #d1fae5;
            border: 1px solid #10b981;
            color: #065f46;
        }
        .result.error {
            background: #fee2e2;
            border: 1px solid #ef4444;
            color: #991b1b;
        }
        .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        small {
            color: #666;
            font-size: 12px;
        }
        @media (max-width: 768px) {
            .grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Demo User Management</h1>
        <p>Create and manage demo access for Blue Tradie prospects</p>
    </div>

    <div class="grid">
        <div class="card">
            <h2>Create Demo User</h2>
            <form id="createDemoForm">
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" required 
                           placeholder="prospect@example.com">
                </div>

                <div class="form-group">
                    <label for="firstName">First Name</label>
                    <input type="text" id="firstName" name="firstName" required 
                           placeholder="John">
                </div>

                <div class="form-group">
                    <label for="lastName">Last Name</label>
                    <input type="text" id="lastName" name="lastName" required 
                           placeholder="Smith">
                </div>

                <div class="form-group">
                    <label for="businessName">Business Name</label>
                    <input type="text" id="businessName" name="businessName" required 
                           placeholder="Smith Electrical Services">
                </div>

                <div class="form-group">
                    <label for="trade">Trade</label>
                    <select id="trade" name="trade" required>
                        <option value="">Select Trade</option>
                        <option value="Electrician">Electrician</option>
                        <option value="Plumber">Plumber</option>
                        <option value="Builder">Builder</option>
                        <option value="Carpenter">Carpenter</option>
                        <option value="Painter">Painter</option>
                        <option value="Roofer">Roofer</option>
                        <option value="HVAC Technician">HVAC Technician</option>
                        <option value="Landscaper">Landscaper</option>
                        <option value="Flooring Installer">Flooring Installer</option>
                        <option value="Tiler">Tiler</option>
                        <option value="Plasterer">Plasterer</option>
                        <option value="Handyman">Handyman</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="serviceArea">Service Area</label>
                    <input type="text" id="serviceArea" name="serviceArea" required 
                           placeholder="Sydney, NSW">
                </div>

                <div class="form-group">
                    <label for="country">Country</label>
                    <select id="country" name="country" required>
                        <option value="Australia">Australia</option>
                        <option value="New Zealand">New Zealand</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="durationDays">Demo Duration (Days)</label>
                    <select id="durationDays" name="durationDays">
                        <option value="7">7 Days</option>
                        <option value="14" selected>14 Days (Recommended)</option>
                        <option value="21">21 Days</option>
                        <option value="30">30 Days</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="tokenLimit">AI Token Limit</label>
                    <select id="tokenLimit" name="tokenLimit">
                        <option value="500">500 tokens (~10-15 AI conversations)</option>
                        <option value="1000" selected>1000 tokens (~20-30 conversations) ⭐</option>
                        <option value="2000">2000 tokens (~40-60 conversations)</option>
                        <option value="3000">3000 tokens (~60-90 conversations)</option>
                    </select>
                    <small>1000 tokens = sufficient for thorough testing of all AI advisors</small>
                </div>

                <div class="form-group">
                    <label>
                        <input type="checkbox" id="ugcEligible" name="ugcEligible" checked style="margin-right: 8px; width: auto;">
                        Enable UGC Incentives (Content Creator Bonuses)
                    </label>
                    <small style="display: block; margin-top: 5px;">
                        Allows user to earn bonus tokens through testimonials (+200), social posts (+100), case studies (+500 + Founding Member status)
                    </small>
                </div>

                <button type="submit" class="btn">Create Demo User</button>
                
                <div id="createResult" class="result"></div>
            </form>
        </div>

        <div class="card">
            <h2>Check Demo Status</h2>
            <form id="statusForm">
                <div class="form-group">
                    <label for="userId">User ID</label>
                    <input type="text" id="userId" name="userId" required 
                           placeholder="demo_1234567890_abcdef123">
                </div>

                <button type="submit" class="btn btn-success">Check Status</button>
                
                <div id="statusResult" class="result"></div>
            </form>

            <h3 style="margin-top: 30px;">Test Welcome Email</h3>
            <form id="emailTestForm">
                <div class="form-group">
                    <label for="testEmail">Your Email Address</label>
                    <input type="email" id="testEmail" name="testEmail" required 
                           placeholder="your.email@example.com">
                    <small>Send yourself a test welcome email to see what new signups receive</small>
                </div>

                <button type="submit" class="btn btn-success">Send Test Email</button>
                
                <div id="emailTestResult" class="result"></div>
            </form>

            <h3 style="margin-top: 30px;">Extend Demo</h3>
            <form id="extendForm">
                <div class="form-group">
                    <label for="extendUserId">User ID</label>
                    <input type="text" id="extendUserId" name="extendUserId" required 
                           placeholder="demo_1234567890_abcdef123">
                </div>

                <div class="form-group">
                    <label for="additionalDays">Additional Days</label>
                    <select id="additionalDays" name="additionalDays">
                        <option value="7" selected>7 Days</option>
                        <option value="14">14 Days</option>
                        <option value="21">21 Days</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="additionalTokens">Additional Tokens</label>
                    <input type="number" id="additionalTokens" name="additionalTokens" 
                           placeholder="0" min="0" step="100">
                </div>

                <button type="submit" class="btn btn-success">Extend Demo</button>
                
                <div id="extendResult" class="result"></div>
            </form>
        </div>
    </div>

    <script>
        const API_BASE = window.location.origin;

        // Create demo user
        document.getElementById('createDemoForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            data.ugcEligible = document.getElementById('ugcEligible').checked;
            
            try {
                const response = await fetch(API_BASE + '/api/demo/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });
                
                const result = await response.json();
                const resultDiv = document.getElementById('createResult');
                
                if (result.success) {
                    resultDiv.className = 'result success';
                    resultDiv.style.display = 'block';
                    resultDiv.innerHTML = \`
                        <h4>Demo User Created Successfully!</h4>
                        <p><strong>User ID:</strong> \${result.userId}</p>
                        <p><strong>Demo Expires:</strong> \${new Date(result.user.demoExpiresAt).toLocaleDateString()}</p>
                        <p><strong>Token Limit:</strong> \${result.user.demoTokenLimit} tokens</p>
                        <p style="margin-top: 15px; padding: 10px; background: #e0f2fe; border-radius: 5px;">
                            <strong>Next Step:</strong> Send the user the demo message with their login instructions.
                        </p>
                    \`;
                    e.target.reset();
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.style.display = 'block';
                    resultDiv.innerHTML = \`<strong>Error:</strong> \${result.message}\`;
                }
            } catch (error) {
                const resultDiv = document.getElementById('createResult');
                resultDiv.className = 'result error';
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = \`<strong>Error:</strong> Failed to create demo user\`;
            }
        });

        // Check demo status
        document.getElementById('statusForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const userId = formData.get('userId');
            
            try {
                const response = await fetch(API_BASE + '/api/demo/status/' + userId);
                const result = await response.json();
                const resultDiv = document.getElementById('statusResult');
                
                if (result.success) {
                    const status = result.status;
                    resultDiv.className = 'result success';
                    resultDiv.style.display = 'block';
                    resultDiv.innerHTML = \`
                        <h4>Demo Status</h4>
                        <p><strong>Status:</strong> \${status.status}</p>
                        <p><strong>Expires:</strong> \${new Date(status.expiresAt).toLocaleDateString()}</p>
                        <p><strong>Tokens Used:</strong> \${status.tokensUsed} / \${status.tokenLimit}</p>
                        <p><strong>Days Remaining:</strong> \${status.daysRemaining}</p>
                    \`;
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.style.display = 'block';
                    resultDiv.innerHTML = \`<strong>Error:</strong> \${result.message}\`;
                }
            } catch (error) {
                const resultDiv = document.getElementById('statusResult');
                resultDiv.className = 'result error';
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = \`<strong>Error:</strong> Failed to check demo status\`;
            }
        });

        // Test welcome email
        document.getElementById('emailTestForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const testEmail = formData.get('testEmail');
            
            try {
                const response = await fetch(API_BASE + '/api/email-test/send-welcome', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        testEmail: testEmail,
                        firstName: 'Test User',
                        businessName: 'Test Business',
                        trade: 'Electrician',
                        country: 'Australia'
                    })
                });
                
                const result = await response.json();
                const resultDiv = document.getElementById('emailTestResult');
                
                if (result.success) {
                    resultDiv.className = 'result success';
                    resultDiv.style.display = 'block';
                    resultDiv.innerHTML = \`
                        <h4>Test Email Sent Successfully!</h4>
                        <p>Check your email inbox for the welcome message.</p>
                        <p><small>This is exactly what new signups receive when they join the waitlist.</small></p>
                    \`;
                    e.target.reset();
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.style.display = 'block';
                    resultDiv.innerHTML = \`<strong>Error:</strong> \${result.message}\`;
                }
            } catch (error) {
                const resultDiv = document.getElementById('emailTestResult');
                resultDiv.className = 'result error';
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = \`<strong>Error:</strong> Failed to send test email\`;
            }
        });

        // Extend demo
        document.getElementById('extendForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            try {
                const response = await fetch(API_BASE + '/api/demo/extend/' + data.extendUserId, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        additionalDays: parseInt(data.additionalDays),
                        additionalTokens: parseInt(data.additionalTokens) || 0
                    })
                });
                
                const result = await response.json();
                const resultDiv = document.getElementById('extendResult');
                
                if (result.success) {
                    resultDiv.className = 'result success';
                    resultDiv.style.display = 'block';
                    resultDiv.innerHTML = \`
                        <h4>Demo Extended Successfully!</h4>
                        <p><strong>New Expiry:</strong> \${new Date(result.user.demoExpiresAt).toLocaleDateString()}</p>
                        <p><strong>New Token Limit:</strong> \${result.user.demoTokenLimit} tokens</p>
                    \`;
                    e.target.reset();
                } else {
                    resultDiv.className = 'result error';
                    resultDiv.style.display = 'block';
                    resultDiv.innerHTML = \`<strong>Error:</strong> \${result.message}\`;
                }
            } catch (error) {
                const resultDiv = document.getElementById('extendResult');
                resultDiv.className = 'result error';
                resultDiv.style.display = 'block';
                resultDiv.innerHTML = \`<strong>Error:</strong> Failed to extend demo\`;
            }
        });
    </script>
</body>
</html>
    `);
  });

  // Serve test email HTML file
  app.get('/test-email-updated.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../test-email-updated.html'));
  });

  // Usage monitoring middleware (track all API calls)
  const usageMonitor = UsageMonitor.getInstance();
  app.use('/api', usageMonitor.trackApiCall);
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes (use simple auth for beta testing)
  app.get('/api/auth/user', async (req: any, res) => {
    console.log('[DEBUG AUTH] Session data:', {
      isTestAuthenticated: req.session?.isTestAuthenticated,
      testUser: req.session?.testUser ? 'present' : 'missing',
      testUserData: req.session?.testUser,
      sessionId: req.session?.id,
      cookieHeader: req.headers.cookie,
      sessionKeys: Object.keys(req.session || {})
    });
    
    // Check for demo session first
    if (req.session?.isTestAuthenticated && req.session?.testUser) {
      try {
        // Get full user record from database for demo users
        const demoUser = req.session.testUser;
        console.log('[DEBUG AUTH] Using demo user from session:', demoUser.id);
        
        // Try to get fresh data from database, but fall back to session data
        let user;
        try {
          user = await storage.getUser(demoUser.id);
          if (!user) {
            return res.status(404).json({ error: "User not found" });
          }
          console.log('[DEBUG AUTH] Fresh demo user from DB:', user.id);
        } catch (dbError) {
          console.log('[DEBUG AUTH] Using session demo user data:', demoUser.id);
          // Return session data with proper structure
          user = {
            id: demoUser.id,
            firstName: demoUser.firstName,
            lastName: demoUser.lastName,
            email: demoUser.email,
            country: demoUser.country || 'Australia',
            trade: demoUser.trade || 'Electrician',
            businessName: demoUser.businessName,
            profileImageUrl: demoUser.profileImageUrl,
            isOnboarded: demoUser.isOnboarded || false,
            isDemoUser: true,
            demoTokenLimit: 1000000,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
        
        return res.json(user);
      } catch (error) {
        console.error("Error with demo user session:", error);
        return res.status(401).json({ message: "Demo session invalid" });
      }
    }
    
    // Fall back to regular auth
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        console.log('[DEBUG AUTH] No userId found, unauthorized');
        return res.status(401).json({ message: "Unauthorized" });
      }
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Profile endpoint for /api/onboarding (legacy support)
  app.post('/api/onboarding', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = req.body;
      
      // Update user profile
      await storage.updateUser(userId, {
        businessName: data.businessName,
        trade: data.trade,
        serviceArea: data.serviceArea,
        country: data.country,
        isGstRegistered: data.isGstRegistered
      });
      
      res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Logo upload endpoint
  app.post('/api/upload-logo', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { businessName } = req.body;
      
      // Mark logo as uploaded (in real implementation would handle file upload)
      const logoPlaceholder = `logo-${userId}-${Date.now()}`;
      
      await storage.updateUser(userId, {
        businessLogo: logoPlaceholder
      });
      
      // Mark profile milestone as completed
      await JourneyTracker.updateMilestone({
        userId,
        milestoneId: "profile_completed", 
        completed: true
      });
      
      res.json({ 
        success: true, 
        logoUrl: logoPlaceholder,
        message: "Logo uploaded successfully" 
      });
    } catch (error) {
      console.error("Error uploading logo:", error);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  // Onboarding routes
  app.post('/api/user/onboarding', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const onboardingData = req.body;
      const currentOrgId = req.session?.currentOrgId || 'demo-org-default';
      
      console.log(`[ONBOARDING] User ${userId} completing onboarding for org ${currentOrgId}`);
      
      // Update per-org onboarding status in organizationUsers table
      const { db } = await import('./db');
      const { organizationUsers, organizations } = await import('../shared/schema');
      const { and, eq } = await import('drizzle-orm');
      
      // Ensure organization exists
      await db.insert(organizations).values({
        id: currentOrgId,
        name: currentOrgId.includes('demo') ? 'Demo Organization' : 'Default Organization',
        type: currentOrgId.includes('demo') ? 'demo' : 'trial',
        isDemo: currentOrgId.includes('demo'),
      }).onConflictDoNothing();
      
      // Update org-user relationship with onboarding completion
      await db.insert(organizationUsers).values({
        userId,
        organizationId: currentOrgId,
        role: 'owner',
        isOnboarded: true,
        onboardedAt: new Date(),
      }).onConflictDoNothing();
      
      // For demo users, also update session
      if (req.session?.testUser) {
        req.session.testUser = {
          ...req.session.testUser,
          ...onboardingData,
          isOnboarded: true
        };
        console.log(`[ONBOARDING] Demo user ${userId} session updated for org ${currentOrgId}`);
      }
      
      const { businessName, trade, serviceArea, country, isGstRegistered, businessType, experience, currentRevenue } = onboardingData;
      
      // Update user in database (works for both demo and regular users)
      const user = await storage.updateUserOnboarding(userId, {
        businessName,
        trade,
        serviceArea,
        country,
        isGstRegistered: isGstRegistered || false,
        isOnboarded: true // Legacy field for backward compatibility
      });
      
      console.log(`[ONBOARDING] User ${userId} onboarded for org ${currentOrgId}`);
      
      res.json({
        ...user,
        organizationId: currentOrgId,
        organizationOnboarded: true,
      });
    } catch (error) {
      console.error("Error updating onboarding:", error);
      res.status(500).json({ message: "Failed to update onboarding" });
    }
  });

  // Onboarding task completion tracking
  app.post('/api/onboarding/task/:taskId', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { taskId } = req.params;
      
      // For now, just return success (would normally track in database)
      res.json({ 
        success: true, 
        taskId, 
        userId,
        completedAt: new Date() 
      });
    } catch (error) {
      console.error("Error tracking onboarding task:", error);
      res.status(500).json({ message: "Failed to track onboarding task" });
    }
  });

  // Stripe checkout route moved to registerEssentialApiRoutes for better availability

  // Stripe webhook handler for checkout completion
  app.post('/api/webhook/stripe', (await import('express')).raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!endpointSecret) {
      console.error('Stripe webhook secret not configured');
      return res.status(400).send('Webhook secret not configured');
    }

    try {
      const stripe = await import('stripe');
      const stripeClient = new stripe.default(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-07-30.basil',
      });

      const event = stripeClient.webhooks.constructEvent(req.body, sig, endpointSecret);
      
      console.log(`[STRIPE WEBHOOK] Received event: ${event.type}`);

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as any;
        const metadata = session.metadata;
        
        if (!metadata || !metadata.userId) {
          console.error('No metadata found in Stripe session');
          return res.status(400).send('Invalid session metadata');
        }

        // Create user account after successful Stripe checkout
        const user = await storage.upsertUser({
          id: metadata.userId,
          email: session.customer_email || metadata.email,
          firstName: metadata.firstName,
          lastName: metadata.lastName,
          businessName: metadata.businessName,
          trade: metadata.trade,
          serviceArea: metadata.serviceArea,
          country: metadata.country,
          isGstRegistered: metadata.isGstRegistered === 'true',
          isOnboarded: true,
          isFreeTrialUser: true,
          freeTrialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          stripeCustomerId: session.customer,
          subscriptionTier: metadata.plan === 'teams' ? 'Blue Teams' : 'Blue Core',
          metadata: { 
            signupDate: new Date().toISOString(),
            stripeSessionId: session.id,
            plan: metadata.plan
          }
        });

        // Send welcome email
        try {
          const { emailService } = await import("./services/sendgrid-email-service");
          await emailService.sendEmail({
            to: session.customer_email,
            subject: "Welcome to Blue Tradie - Your Free Month Starts Now! 🎉",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e40af;">Welcome to Blue Tradie, ${metadata.firstName}!</h2>
                <p>Your ${metadata.plan === 'teams' ? 'Teams' : 'Pro'} plan trial has started! You have 30 days of full access.</p>
                <div style="background: #f3f4f6; padding: 20px; margin: 20px 0; border-radius: 8px;">
                  <h3 style="margin: 0; color: #1e40af;">What's Next?</h3>
                  <ul style="margin: 10px 0;">
                    <li>✅ Chat with your 6 AI Business Advisors</li>
                    <li>✅ Create professional invoices with GST</li>
                    <li>✅ Connect with other tradies in the directory</li>
                    <li>✅ Set up smart business automation</li>
                  </ul>
                </div>
                <p><a href="${process.env.APP_BASE_URL || 'http://localhost:5000'}/dashboard" 
                      style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Get Started Now
                </a></p>
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  Your free month ends on ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}. 
                  You'll receive 3 reminder emails before billing starts. Cancel anytime!
                </p>
              </div>
            `
          });
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }

        console.log(`[STRIPE WEBHOOK] User created successfully: ${metadata.userId}`);
      }

      if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        
        // Find user by Stripe customer ID and update subscription info
        // Note: Since getAllUsers doesn't exist, we'll skip this for now
        // This webhook event is less critical than checkout.session.completed
        console.log(`[STRIPE WEBHOOK] Subscription ${subscription.id} updated for customer ${customerId}`);
      }

      res.json({ received: true });

    } catch (err) {
      console.error('Stripe webhook error:', err);
      res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }
  });

  // Billing portal route
  app.get('/api/billing/portal', async (req: any, res) => {
    try {
      const user = req.session?.user;
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ message: "No billing account found" });
      }

      const stripe = await import('stripe');
      const stripeClient = new stripe.default(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-07-30.basil',
      });

      const session = await stripeClient.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.APP_BASE_URL || 'http://localhost:5000'}/dashboard`,
      });

      res.json({ url: session.url });

    } catch (error) {
      console.error("Billing portal error:", error);
      res.status(500).json({ 
        message: "Failed to create billing portal session. Please try again.",
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // Trial reminder system routes
  app.post('/api/admin/send-trial-reminders', async (req, res) => {
    try {
      const { dryRun = false } = req.body;
      
      const { trialReminderService } = await import('./services/trial-reminder-service');
      const results = await trialReminderService.sendDailyReminders(dryRun);
      
      res.json({
        success: true,
        results,
        message: dryRun ? 'Dry run completed' : 'Reminders sent successfully'
      });

    } catch (error) {
      console.error("Trial reminder error:", error);
      res.status(500).json({ 
        message: "Failed to process trial reminders",
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // Check trial status for current user
  app.get('/api/trial-status', async (req: any, res) => {
    try {
      const user = req.session?.user;
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      if (!user.isFreeTrialUser || !user.freeTrialEndsAt) {
        return res.json({
          isTrialUser: false,
          message: "Not on free trial"
        });
      }

      const trialEndDate = new Date(user.freeTrialEndsAt);
      const now = new Date();
      const daysRemaining = Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const hasExpired = daysRemaining <= 0;

      res.json({
        isTrialUser: true,
        trialEndsAt: user.freeTrialEndsAt,
        daysRemaining: Math.max(0, daysRemaining),
        hasExpired,
        plan: user.subscriptionTier || 'Blue Core',
        billingAmount: user.subscriptionTier?.includes('Teams') ? '$149' : '$59'
      });

    } catch (error) {
      console.error("Trial status error:", error);
      res.status(500).json({ 
        message: "Failed to get trial status",
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      
      const [todaysJobs, weeklyIncome, outstandingInvoices, monthlyStats] = await Promise.all([
        storage.getTodaysJobs(userId),
        storage.getWeeklyIncome(userId),
        storage.getOutstandingInvoices(userId),
        storage.getMonthlyStats(userId)
      ]);

      const outstandingAmount = outstandingInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);

      res.json({
        todaysJobs: todaysJobs.length,
        weeklyIncome,
        outstandingAmount,
        monthlyStats,
        recentJobs: todaysJobs.slice(0, 5),
        recentInvoices: outstandingInvoices.slice(0, 5)
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Real-time dashboard stats endpoint for Quick View KPIs  
  app.get('/api/dashboard/stats', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.user?.id;
      
      // Temporary placeholders; TODO replace with real DB table references:
      // const [jobCount] = await db.select({ count: sql`count(*)` }).from(jobs).where(sql`user_id = ${userId}`);
      // const [expenseCount] = await db.select({ count: sql`count(*)` }).from(expenses).where(sql`user_id = ${userId}`);
      
      // Temporary hardcoded values until real tables are available
      const jobCount = { count: 0 };
      const expenseCount = { count: 0 };
      
      // Get live counts from database  
      const [invoiceCount] = await db.select({ count: sql`count(*)` }).from(invoices).where(sql`user_id = ${userId}`);
      
      // Calculate totals
      const [invoiceTotal] = await db.select({ 
        total: sql`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` 
      }).from(invoices).where(sql`user_id = ${userId}`);
      
      // Temporary placeholder until expenses table is available
      const expenseTotal = { total: 0 };
      // const [expenseTotal] = await db.select({ 
      //   total: sql`COALESCE(SUM(CAST(amount AS DECIMAL)), 0)` 
      // }).from(expenses).where(sql`user_id = ${userId}`);
      
      res.json({
        totalJobs: Number(jobCount.count),
        totalInvoices: Number(invoiceCount.count),
        totalExpenses: Number(expenseCount.count),
        totalInvoiceAmount: Number(invoiceTotal.total || 0),
        totalExpenseAmount: Number(expenseTotal.total || 0),
        netIncome: Number(invoiceTotal.total || 0) - Number(expenseTotal.total || 0),
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Job routes
  app.post('/api/jobs', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobData = insertJobSchema.parse({ ...req.body, userId });
      
      const job = await storage.createJob(jobData);
      res.json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(500).json({ message: "Failed to create job" });
    }
  });

  app.get('/api/jobs', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobs = await storage.getJobsByUser(userId);
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  app.put('/api/jobs/:id', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const jobId = parseInt(req.params.id);
      const jobData = insertJobSchema.parse({ ...req.body, userId });
      
      const job = await storage.updateJob(jobId, jobData);
      res.json(job);
    } catch (error) {
      console.error("Error updating job:", error);
      res.status(500).json({ message: "Failed to update job" });
    }
  });

  // Invoice routes
  app.post('/api/invoices', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Prepare invoice data (invoice number and yearSequence will be auto-generated)
      const processedData = {
        ...req.body,
        userId,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
      };
      
      // Validate data without auto-generated fields
      const validatedData = insertInvoiceSchema.parse(processedData);
      
      // Create invoice (storage will auto-generate invoice number and year sequence)
      const invoice = await storage.createInvoice(validatedData);
      
      // Mark first invoice milestone as completed
      await JourneyTracker.updateMilestone({
        userId,
        milestoneId: "first_invoice_created",
        completed: true
      });
      
      res.json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.get('/api/invoices', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invoices = await storage.getInvoicesByUser(userId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.patch('/api/invoices/:id', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invoiceId = parseInt(req.params.id);
      const { status } = req.body;
      
      const paidDate = status === 'paid' ? new Date() : undefined;
      const invoice = await storage.updateInvoiceStatus(invoiceId, status, paidDate);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.put('/api/invoices/:id', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.updateInvoice(invoiceId, req.body);
      res.json(invoice);
    } catch (error) {
      console.error("Error updating full invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.post('/api/invoices/:id/send', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const invoiceId = parseInt(req.params.id);
      
      // For demo users, just return success message
      // In production, this would send actual emails
      res.json({ 
        success: true, 
        message: "Invoice sending functionality is available for paid plans. Demo users can preview and download invoices.",
        demoNote: "This feature requires a paid subscription for email delivery."
      });
    } catch (error) {
      console.error("Error sending invoice:", error);
      res.status(500).json({ message: "Failed to send invoice" });
    }
  });

  app.post('/api/invoices/generate', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const { jobDescription, customerName } = req.body;
      const content = await generateInvoiceContent(jobDescription, customerName);
      res.json(content);
    } catch (error) {
      console.error("Error generating invoice content:", error);
      res.status(500).json({ message: "Failed to generate invoice content" });
    }
  });

  // Logo generation route (now handled by marketing agent)
  app.post('/api/marketing/generate-logo', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { businessName, trade, colors, symbols, vibe } = req.body;
      
      if (!businessName || !trade) {
        return res.status(400).json({ message: "Business name and trade are required" });
      }
      
      const logoResult = await generateLogoConcept(
        businessName, 
        trade, 
        colors || "blue and white", 
        symbols || "professional symbols", 
        vibe || "professional",
        user?.country || "Australia"
      );
      
      res.json(logoResult);
    } catch (error) {
      console.error("Error generating logo:", error);
      res.status(500).json({ message: "Failed to generate logo concept" });
    }
  });

  // Note: Goals setup endpoint moved to line ~1887 with enhanced milestone tracking

  // User goals endpoint for dashboard
  app.get('/api/user/goals', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.goals) {
        return res.status(404).json({ message: "Goals not set up yet" });
      }
      
      // Transform stored goals data to match component interface
      const goalsData = {
        financial: {
          targetRevenue: (user.goals as any)?.financial?.monthlyTarget * 12 || 0,
          currentRevenue: 0, // Could be calculated from invoices
          targetClients: 50, // Default target
          currentClients: 0, // Could be calculated from unique customers
        },
        business: {
          growthGoal: "Grow steady business",
          timeframe: "12 months",
          challenges: ["Time management", "Customer acquisition"]
        },
        personal: {
          workLifeBalance: "Balanced work schedule",
          skillDevelopment: ["Digital marketing", "Customer service"],
          vision: user.visionSentence || "Building a successful trade business"
        }
      };
      
      res.json(goalsData);
    } catch (error) {
      console.error("Error fetching user goals:", error);
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  // Helper function to generate keyword-based image URLs from Picsum (copyright-free)
  function generateKeywordImage(keywords: string, category: string) {
    // Generate keyword-specific seed for consistent results
    const keywordHash = keywords.toLowerCase().split(' ').join('').slice(0, 10);
    let seed = 0;
    for (let i = 0; i < keywordHash.length; i++) {
      seed += keywordHash.charCodeAt(i);
    }
    
    // Map keywords to specific image categories
    const lowerKeywords = keywords.toLowerCase();
    let imageId = seed % 1000 + 1;
    
    // Override with specific images based on keywords
    if (lowerKeywords.includes('ute') || lowerKeywords.includes('truck') || lowerKeywords.includes('vehicle')) {
      imageId = 180; // Car/vehicle image
    } else if (lowerKeywords.includes('house') || lowerKeywords.includes('home') || lowerKeywords.includes('property')) {
      imageId = 106; // House image
    } else if (lowerKeywords.includes('vacation') || lowerKeywords.includes('travel') || lowerKeywords.includes('holiday')) {
      imageId = 200; // Travel/beach
    } else if (lowerKeywords.includes('family') || lowerKeywords.includes('kids') || lowerKeywords.includes('children')) {
      imageId = 227; // Family/people
    } else if (lowerKeywords.includes('money') || lowerKeywords.includes('income') || lowerKeywords.includes('financial')) {
      imageId = 259; // Business/money
    } else if (lowerKeywords.includes('tools') || lowerKeywords.includes('equipment') || lowerKeywords.includes('workshop')) {
      imageId = 162; // Tools/workspace
    }
    
    const timestamp = Date.now();
    return `https://picsum.photos/400/400?random=${imageId}&t=${timestamp}`;
  }

  // Vision board endpoint for dashboard
  app.get('/api/user/vision-board', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.goals || !user.visionSentence) {
        return res.status(404).json({ message: "Vision board not generated yet" });
      }
      
      const goals = user.goals as any;
      
      // Generate keyword-accurate vision board based on user goals
      const visionBoard = [
        {
          id: "1",
          category: "Financial",
          title: "Monthly Income Goal",
          description: `Earning $${goals?.financial?.monthlyTarget || 8000}/month`,
          image: generateKeywordImage(`${goals?.financial?.monthlyTarget || 8000} dollars monthly income business success`, "Financial"),
          progress: 25,
          priority: "high" as const,
          keywords: `monthly income ${goals?.financial?.monthlyTarget || 8000} business financial success`,
          isCustom: false
        },
        {
          id: "2", 
          category: "Personal",
          title: "Dream Holiday",
          description: `${goals?.personal?.holiday || "Dream vacation"} - ${goals?.personal?.holidayActivity || "relaxing"}`,
          image: generateKeywordImage(`${goals?.personal?.holiday || "tropical vacation"} ${goals?.personal?.holidayActivity || "beach relaxation"}`, "Personal"),
          progress: 0,
          priority: "medium" as const,
          keywords: `${goals?.personal?.holiday} ${goals?.personal?.holidayActivity} vacation travel`,
          isCustom: false
        },
        {
          id: "3",
          category: "Business",
          title: "Professional Growth", 
          description: `${goals?.work?.jobsPerWeek || 15} jobs per week`,
          image: generateKeywordImage(`${user.trade || 'construction'} professional tradesman tools building`, "Business"),
          progress: 40,
          priority: "high" as const,
          keywords: `${user.trade || 'trade'} professional work construction tools`,
          isCustom: false
        },
        {
          id: "4",
          category: "Lifestyle",
          title: "Work-Life Balance",
          description: "Quality time with family",
          image: generateKeywordImage("family time home happiness work life balance", "Lifestyle"),
          progress: 15,
          priority: "medium" as const,
          keywords: "family time balance lifestyle happiness",
          isCustom: false
        },
        {
          id: "5",
          category: "Assets",
          title: "Big Purchase Goal",
          description: goals?.personal?.purchase || "New equipment",
          image: generateKeywordImage(`${goals?.personal?.purchase || "new truck vehicle"} purchase investment`, "Assets"),
          progress: 0,
          priority: "low" as const,
          keywords: `${goals?.personal?.purchase} purchase investment vehicle`,
          isCustom: false
        },
        {
          id: "6",
          category: "Achievement",
          title: "Success Vision",
          description: user.visionSentence?.slice(0, 60) + "..." || "Thriving trade business",
          image: generateKeywordImage("business success achievement goal celebration victory", "Achievement"),
          progress: 30,
          priority: "high" as const,
          keywords: "success achievement business victory celebration",
          isCustom: false
        }
      ];

      // Apply any session-based updates to vision board items
      let visionBoardItems = visionBoard.map(item => {
        const sessionUpdates = req.session.visionBoardUpdates?.[item.id];
        if (sessionUpdates) {
          return { ...item, ...sessionUpdates, updatedAt: new Date() };
        }
        return item;
      });

      // Check if force regeneration flag is set
      if (req.session.forceVisionBoardRegeneration) {
        // Generate fresh images for all items
        visionBoardItems = visionBoardItems.map(item => ({
          ...item,
          image: generateKeywordImage(item.keywords, item.category),
          isCustom: false
        }));
        // Clear any existing updates since we're regenerating fresh
        req.session.visionBoardUpdates = {};
        // Clear the flag
        req.session.forceVisionBoardRegeneration = false;
        console.log(`Force regeneration completed - new images generated with timestamp: ${Date.now()}`);
      }
      
      res.json(visionBoardItems);
    } catch (error) {
      console.error("Error fetching vision board:", error);
      res.status(500).json({ message: "Failed to fetch vision board" });
    }
  });

  // Analytics tracking endpoint
  app.post('/api/analytics/track', async (req, res) => {
    try {
      const event = req.body;
      console.log(`[ANALYTICS] ${event.event} at ${event.timestamp}`, {
        userId: event.userId || 'anonymous',
        sessionId: event.sessionId,
        data: event.data
      });
      
      // TODO: In production, store these in database for proper analytics
      // For now, server-side logging provides immediate visibility
      
      res.json({ success: true });
    } catch (error) {
      console.error("[ANALYTICS] Error processing event:", error);
      res.status(500).json({ message: "Failed to track event" });
    }
  });

  // Analytics dashboard endpoint (for admin)
  app.get('/api/analytics/events', async (req, res) => {
    // TODO: Return stored analytics events for dashboard
    res.json({ message: "Analytics dashboard coming soon" });
  });

  // Waitlist routes
  app.post('/api/waitlist', async (req, res) => {
    try {
      const { email, firstName, lastName, country, trade } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const { waitlistService } = await import('./services/waitlist-service');
      
      // Add to waitlist with trade information
      const entry = await waitlistService.addToWaitlist({
        email,
        firstName,
        lastName,
        country,
        trade
      });

      // DISABLED: VIP signup notification (was causing dual emails during signup)
      // Notify support@bluetradie.com about new signup
      /*
      try {
        const { emailService } = await import('./services/email-service');
        await emailService.sendEmail({
          to: 'support@bluetradie.com',
          subject: `🔥 New Blue Tradie VIP Signup: ${firstName} ${lastName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">🔥 New VIP Waitlist Signup!</h1>
              </div>
              <div style="background: #f8fafc; padding: 20px;">
                <div style="background: white; padding: 20px; border-radius: 8px;">
                  <h2 style="color: #1f2937; margin-top: 0;">New Signup Details:</h2>
                  <p><strong>Name:</strong> ${firstName} ${lastName}</p>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Country:</strong> ${country}</p>
                  <p><strong>Trade:</strong> ${trade || 'Not specified'}</p>
                  <p><strong>Signup Time:</strong> ${new Date().toLocaleString('en-AU', { 
                    timeZone: 'Australia/Sydney',
                    dateStyle: 'full',
                    timeStyle: 'short'
                  })}</p>
                </div>
              </div>
            </div>
          `
        });
        console.log(`✅ VIP signup notification sent for ${email}`);
      } catch (emailError) {
        console.error("Failed to send waitlist notification email:", emailError);
        // Don't fail the signup if email fails
      }
      */

      const position = await waitlistService.getWaitlistPosition(email);
      
      res.json({ 
        success: true, 
        message: "Successfully added to waitlist",
        position,
        waitlistId: entry.id
      });
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      res.status(500).json({ message: "Failed to add to waitlist" });
    }
  });

  app.get('/api/waitlist/status', async (req, res) => {
    try {
      const { waitlistService } = await import('./services/waitlist-service');
      const count = await waitlistService.getWaitlistCount();
      
      res.json({ 
        waitlistCount: count,
        message: `${count} people on waitlist`
      });
    } catch (error) {
      console.error("Error getting waitlist status:", error);
      res.status(500).json({ message: "Failed to get waitlist status" });
    }
  });

  // Admin: Export waitlist
  app.get('/api/admin/waitlist/export', async (req, res) => {
    try {
      const { waitlistService } = await import('./services/waitlist-service');
      const entries = await waitlistService.exportWaitlist();
      
      res.json(entries);
    } catch (error) {
      console.error("Error exporting waitlist:", error);
      res.status(500).json({ message: "Failed to export waitlist" });
    }
  });

  // Admin: Manual email test for deliverability audit
  app.post('/api/admin/test-email', async (req, res) => {
    try {
      const { email, type = 'welcome' } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email address required" });
      }

      const { emailService } = await import('./services/sendgrid-email-service');
      // TODO: Add vip-signup-flow-aug2025 module
      // const { vipSignUpFlow } = await import('./services/vip-signup-flow-aug2025');
      
      let subject, html;
      
      if (type === 'welcome') {
        subject = '🔧 [TEST] Welcome to Blue Tradie - You\'re In!';
        // TODO: Replace with actual vipSignUpFlow when module is available
        html = '<p>Welcome to Blue Tradie! This is a test email.</p>';
        // html = vipSignUpFlow.generateWelcomeEmail({
        //   firstName: 'Test',
        //   lastName: 'User',
        //   email: email,
        //   country: 'Australia'
        // }, "G'day");
      } else if (type === 'demo') {
        subject = '🎉 [TEST] Your Blue Tradie Demo Access is Ready';
        // TODO: Replace with actual vipSignUpFlow when module is available
        html = '<p>Your Blue Tradie Demo Access is Ready! This is a test email.</p>';
        // html = vipSignUpFlow.generateDemoAccessEmail({
        //   firstName: 'Test',
        //   lastName: 'User', 
        //   email: email,
        //   country: 'Australia'
        // }, 'Demo99');
      } else {
        return res.status(400).json({ message: "Invalid email type. Use 'welcome' or 'demo'" });
      }

      const success = await emailService.sendEmail({
        to: email,
        subject: subject,
        html: html
      });

      console.log(`[DELIVERABILITY TEST] Manual ${type} email sent to ${email}: ${success}`);
      
      res.json({ 
        success,
        message: `Manual ${type} email ${success ? 'sent successfully' : 'failed'} to ${email}`,
        type,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error("Error sending test email:", error);
      res.status(500).json({ message: "Failed to send test email" });
    }
  });

  // Admin: Remove email from waitlist
  app.delete('/api/admin/waitlist/:email', async (req, res) => {
    try {
      const { email } = req.params;
      
      const { waitlistService } = await import('./services/waitlist-service');
      await waitlistService.removeFromWaitlist(email);
      
      res.json({ success: true, message: `Removed ${email} from waitlist` });
    } catch (error) {
      console.error("Error removing from waitlist:", error);
      res.status(500).json({ message: "Failed to remove from waitlist" });
    }
  });

  // Test email endpoint for updated welcome emails
  app.post('/api/test-email/welcome', async (req, res) => {
    try {
      const { email, firstName, country, businessName } = req.body;
      
      if (!email || !firstName) {
        return res.status(400).json({ error: 'Email and firstName are required' });
      }
      
      // Use the waitlist service to generate and send the email
      const mockWaitlistEntry = {
        email,
        firstName,
        country: country || 'Australia',
        businessName,
        waitlistPosition: 13,
        signupDate: new Date()
      };
      
      // Import the waitlist service and call the private method
      const { waitlistService } = await import('./services/waitlist-service');
      
      // Generate email content directly
      const greeting = country === "New Zealand" ? "Hey bro" : "G'day mate";
      const emailContent = (waitlistService as any).generateWaitlistEmail(mockWaitlistEntry, greeting);
      
      // Send via SendGrid
      const { emailService } = await import('./services/sendgrid-email-service');
      const subjectGreeting = country === "New Zealand" ? "Hey bro" : "G'day";
      const success = await emailService.sendEmail({
        to: email,
        subject: `${firstName}, ${subjectGreeting}! You're VIP Member #13 - Save $108 First Year! 🚀`,
        html: emailContent
      });
      
      res.json({ success, message: success ? 'Updated welcome email sent successfully!' : 'Failed to send email' });
    } catch (error) {
      console.error('Test email error:', error);
      res.status(500).json({ error: 'Failed to send test email', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Testimonial routes
  app.post('/api/testimonial', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { rating, testimonialText, permissions } = req.body;
      
      // TODO: Store testimonial in database
      console.log(`Testimonial submitted by user ${userId}:`, {
        rating,
        testimonialText: testimonialText.substring(0, 100) + '...',
        permissions
      });
      
      res.json({ 
        success: true, 
        message: "Testimonial submitted successfully" 
      });
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      res.status(500).json({ message: "Failed to submit testimonial" });
    }
  });

  // Update vision board item endpoint
  app.patch('/api/user/vision-board/:itemId', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const { itemId } = req.params;
      const { image, keywords, title, description } = req.body;
      const userId = req.user.claims.sub;
      
      // For now, store updates in session or memory
      // In production, you'd store these in the database
      req.session.visionBoardUpdates = req.session.visionBoardUpdates || {};
      req.session.visionBoardUpdates[itemId] = {
        image,
        keywords,
        title,
        description,
        isCustom: true,
        updatedAt: new Date()
      };
      
      res.json({ success: true, message: "Vision board item updated" });
    } catch (error) {
      console.error("Error updating vision board:", error);
      res.status(500).json({ message: "Failed to update vision board" });
    }
  });

  // Regenerate vision board image endpoint
  app.post('/api/user/vision-board/:itemId/regenerate', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const { itemId } = req.params;
      const { keywords } = req.body;
      
      // Generate new image URL based on keywords
      const newImageUrl = generateKeywordImage(keywords, "Custom");
      
      res.json({ 
        success: true, 
        image: newImageUrl,
        message: "New image generated based on keywords"
      });
    } catch (error) {
      console.error("Error regenerating image:", error);
      res.status(500).json({ message: "Failed to regenerate image" });
    }
  });

  // Upload custom image endpoint
  app.post('/api/user/vision-board/upload-image', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const { imageData, fileName } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "No image data provided" });
      }
      
      // Validate that it's a proper data URL
      if (!imageData.startsWith('data:image/')) {
        return res.status(400).json({ message: "Invalid image format. Please upload a valid image file." });
      }
      
      // Check file size (base64 encoded, so roughly 1.37x the original size)
      const sizeInBytes = (imageData.length * 3) / 4;
      if (sizeInBytes > 2 * 1024 * 1024) { // 2MB limit
        return res.status(400).json({ message: "Image too large. Please use an image smaller than 2MB." });
      }
      
      res.json({ 
        success: true, 
        imageUrl: imageData,
        message: "Image uploaded successfully"
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Regenerate all vision board images endpoint
  app.post('/api/user/vision-board/regenerate-all', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.goals) {
        return res.status(404).json({ message: "No goals found to regenerate images" });
      }
      
      // Clear any existing vision board customizations from session
      if (req.session.visionBoardUpdates) {
        req.session.visionBoardUpdates = {};
      }
      
      // Force regeneration by setting a flag
      req.session.forceVisionBoardRegeneration = true;
      
      res.json({ 
        success: true, 
        message: "All vision board images will be regenerated based on your current goals"
      });
    } catch (error) {
      console.error("Error regenerating all images:", error);
      res.status(500).json({ message: "Failed to regenerate all images" });
    }
  });

  // Onboarding completion endpoint
  app.post('/api/user/onboarding', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { 
        businessName,
        trade, 
        serviceArea,
        country,
        businessType,
        isGstRegistered,
        experience,
        currentRevenue,
        userType,
        gender,
        businessStructure,
        tonePreference,
        financial,
        work,
        personal,
        // Legacy support for simpler onboarding flow
        tradeType,
        region,
        businessSize,
        needs,
        primaryGoal
      } = req.body;

      // Support both new comprehensive form and legacy simple form
      const finalTrade = trade || tradeType;
      const finalCountry = country || (region === 'australia' ? 'Australia' : 'New Zealand');
      const finalBusinessName = businessName;

      const onboardingData = {
        businessName: finalBusinessName,
        trade: finalTrade,
        serviceArea,
        country: finalCountry,
        businessType,
        isGstRegistered,
        experience,
        currentRevenue,
        userType,
        gender,
        businessStructure,
        tonePreference,
        financial,
        work,
        personal,
        // Legacy fields
        tradeType: finalTrade,
        region: finalCountry?.toLowerCase(),
        businessSize,
        needs,
        primaryGoal,
        completedAt: new Date()
      };

      // Check if this is a demo user (session-based) or database user
      const session = req.session as any;
      if (session?.isTestAuthenticated && session?.testUser) {
        // Update demo user in session
        session.testUser = {
          ...session.testUser,
          trade: finalTrade,
          businessName: finalBusinessName,
          country: finalCountry,
          serviceArea: serviceArea,
          businessType: businessType,
          isGstRegistered: isGstRegistered,
          userType: userType || 'tradie',
          gender: gender || 'male',
          businessStructure: businessStructure || 'solo',
          tonePreference: tonePreference || 'casual',
          goals: {
            financial: financial || { monthlyTarget: 8000, savingsTarget: 20000 },
            work: work || { jobsPerWeek: 12 },
            personal: personal || { holiday: 'Bali', holidayActivity: 'relaxing', purchase: 'new ute' }
          },
          visionSentence: `I'm building a successful ${finalTrade?.toLowerCase() || 'trade'} business that provides ${financial?.monthlyTarget || 8000} per month in ${finalCountry}, allowing me to ${personal?.holidayActivity || 'enjoy life'} and afford ${personal?.purchase || 'new equipment'}.`,
          isOnboarded: true
        };
        console.log(`[ONBOARDING] Demo user ${userId} onboarding completed`);
      } else {
        // Update database user for regular users
        await storage.updateUser(userId, {
          trade: finalTrade,
          businessName: finalBusinessName,
          country: finalCountry,
          serviceArea: serviceArea,
          businessType: businessType,
          isGstRegistered: isGstRegistered,
          userType: userType || 'tradie',
          gender: gender || 'male',
          businessStructure: businessStructure || 'solo',
          tonePreference: tonePreference || 'casual',
          goals: {
            financial: financial || { monthlyTarget: 8000, savingsTarget: 20000 },
            work: work || { jobsPerWeek: 12 },
            personal: personal || { holiday: 'Bali', holidayActivity: 'relaxing', purchase: 'new ute' }
          },
          visionSentence: `I'm building a successful ${finalTrade?.toLowerCase() || 'trade'} business that provides ${financial?.monthlyTarget || 8000} per month in ${finalCountry}, allowing me to ${personal?.holidayActivity || 'enjoy life'} and afford ${personal?.purchase || 'new equipment'}.`,
          isOnboarded: true
        });
      }

      // Send welcome email for new users
      if (req.user?.email) {
        const { emailService } = await import('./services/sendgrid-email-service');
        await emailService.sendEmail({
          to: req.user.email,
          from: process.env.FROM_EMAIL ?? "noreply@bluetradie.com",
          subject: "Welcome to Blue Tradie",
          html: "<p>Welcome!</p>"
        });
      }

      // Return updated user data
      if (session?.isTestAuthenticated && session?.testUser) {
        // Return demo user from session
        res.json(session.testUser);
      } else {
        // Return database user
        const updatedUser = await storage.getUser(userId);
        res.json(updatedUser);
      }
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      res.status(500).json({ message: "Failed to save onboarding data" });
    }
  });

  // AI Virtual Assistant endpoints
  app.get('/api/va/chat-history', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get chat history from session storage (in production, use database)
      const chatHistory = req.session.vaChatHistory || [];
      
      res.json(chatHistory);
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  app.post('/api/va/chat', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, type = "general" } = req.body;
      const user = await storage.getUser(userId);
      
      // Initialize chat history if needed
      if (!req.session.vaChatHistory) {
        req.session.vaChatHistory = [];
      }

      // Add user message
      const userMessage = {
        id: Date.now().toString(),
        role: "user",
        content: message,
        timestamp: new Date(),
        type
      };
      req.session.vaChatHistory.push(userMessage);

      // Generate AI response based on message type and context
      let aiResponse = "";
      
      if (type === "setup" || message.toLowerCase().includes("help me")) {
        if (message.toLowerCase().includes("invoice")) {
          aiResponse = `I'll help you set up your first invoice! Here's what we'll do:

📋 **Step 1**: Go to the 'Jobs' section and click 'Create Invoice'
💰 **Step 2**: Add your customer details and line items
🧾 **Step 3**: Set the GST rate (${user?.country === 'Australia' ? '10%' : '15%'} for ${user?.country})
📤 **Step 4**: Send it to your customer

Would you like me to guide you through creating an invoice right now?`;
        } else if (message.toLowerCase().includes("job")) {
          aiResponse = `Let's add a new job to your client book! Here's the process:

🏗️ **Step 1**: Click 'Add Job' from your dashboard
👥 **Step 2**: Enter customer details (name, phone, address)
📝 **Step 3**: Add job description and estimated value
📅 **Step 4**: Set the job status and any notes

Your job will appear in the Client Book where you can track progress and create invoices. Ready to add your first job?`;
        } else if (message.toLowerCase().includes("ai") || message.toLowerCase().includes("advisor")) {
          aiResponse = `Great choice! Blue Tradie has 4 AI business advisors ready to help:

💸 **Accountant**: Tax advice, GST help, financial planning
📣 **Marketing & Branding**: Customer acquisition, branding, advertising  
🎯 **Business Coach**: Goal setting, productivity, business strategy
📜 **Legal**: Contracts, compliance, workplace safety

Each advisor understands ${user?.country} business requirements. Which one would you like to chat with first?`;
        } else if (message.toLowerCase().includes("gst")) {
          aiResponse = `Perfect! Let me explain GST for your ${user?.country} business:

📊 **Your GST Rate**: ${user?.country === 'Australia' ? '10% (ATO)' : '15% (IRD)'}
✅ **Automatic Calculation**: Blue Tradie adds GST to all invoices
📋 **${user?.country === 'Australia' ? 'BAS' : 'GST Return'}**: Track your GST collected vs paid
💡 **Pro Tip**: Keep receipts for GST-claimable expenses

The Accountant AI can help with specific GST questions. Want me to connect you?`;
        } else if (message.toLowerCase().includes("goal")) {
          aiResponse = `Excellent! Setting business goals is crucial for success. Here's how:

🎯 **Step 1**: Go to 'Goals' from your dashboard  
💰 **Step 2**: Set financial targets (monthly income, annual revenue)
🏗️ **Step 3**: Define work goals (jobs per week, growth targets)
🏖️ **Step 4**: Add personal rewards (holiday plans, purchases)
✨ **Step 5**: Create your vision statement

Your AI advisors will reference these goals in all conversations. Ready to set your first goal?`;
        } else {
          aiResponse = `I'm here to help you get the most out of Blue Tradie! I can assist with:

🚀 **Getting Started**: Setting up invoices, jobs, and profiles
💡 **Feature Explanations**: How different parts of the platform work  
🔧 **Troubleshooting**: Solving any issues you encounter
📝 **Feedback Collection**: Sharing your thoughts for improvements

What specific area would you like help with today?`;
        }
      } else if (type === "faq") {
        // Handle FAQ responses
        if (message.toLowerCase().includes("gst") || message.toLowerCase().includes("tax")) {
          aiResponse = `GST is automatically calculated based on your country setting:
          
🇦🇺 **Australia**: 10% GST (ATO requirements)
🇳🇿 **New Zealand**: 15% GST (IRD requirements)

All invoices include GST by default. You can view GST collected in your weekly summary.`;
        } else {
          aiResponse = `Thanks for your question! I've logged this as feedback for our team. In the meantime, try:

• Checking the AI advisors for specialized help
• Looking through the setup guides  
• Contacting our support team if it's urgent

Is there anything else I can help you with?`;
        }
      } else {
        // General conversation
        aiResponse = `Thanks for reaching out! I'm here to help you get the most out of Blue Tradie. 

Some popular topics I can help with:
• Setting up your first invoice or job
• Understanding the AI business advisors
• Explaining ${user?.country} GST requirements
• Troubleshooting any issues

What would you like to know more about?`;
      }

      // Add AI response
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
        type
      };
      req.session.vaChatHistory.push(assistantMessage);

      res.json({ success: true, message: "Message sent successfully" });
    } catch (error) {
      console.error("Error processing chat message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  app.get('/api/va/faqs', isSimpleAuthenticated, async (req: any, res) => {
    try {
      // Sample FAQs - in production, these would come from a database
      const faqs = [
        {
          id: "1",
          question: "How do I set up GST on my invoices?",
          answer: "GST is automatically calculated based on your country. Australia uses 10% GST, New Zealand uses 15%. This is set automatically when you create invoices.",
          category: "Invoicing",
          helpful: 15
        },
        {
          id: "2", 
          question: "How do I create my first job?",
          answer: "Go to your dashboard and click 'Add Job'. Enter customer details, job description, and estimated value. The job will appear in your Client Book.",
          category: "Job Management",
          helpful: 23
        },
        {
          id: "3",
          question: "What are the AI business advisors?",
          answer: "Blue Tradie includes 4 AI advisors: Accountant (tax/finance), Marketing (growth), Business Coach (strategy), and Legal (compliance). Each understands AU/NZ requirements.",
          category: "AI Features",
          helpful: 31
        },
        {
          id: "4",
          question: "How do I track my weekly income?",
          answer: "Your dashboard shows weekly income, outstanding invoices, and job metrics. The weekly summary provides insights and recommendations from your AI advisors.",
          category: "Financial Tracking", 
          helpful: 12
        },
        {
          id: "5",
          question: "Can I set business goals?",
          answer: "Yes! Go to Goals to set financial targets, work objectives, and personal rewards. Your AI advisors will reference these goals in conversations.",
          category: "Goal Setting",
          helpful: 8
        }
      ];
      
      res.json(faqs);
    } catch (error) {
      console.error("Error fetching FAQs:", error);
      res.status(500).json({ message: "Failed to fetch FAQs" });
    }
  });

  app.post('/api/va/feedback', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { feedback, context } = req.body;
      
      // Log feedback (in production, save to database)
      console.log(`VA Feedback from ${userId}:`, { feedback, context, timestamp: new Date() });
      
      res.json({ success: true, message: "Feedback logged successfully" });
    } catch (error) {
      console.error("Error logging feedback:", error);
      res.status(500).json({ message: "Failed to log feedback" });
    }
  });

  // Marketing & Branding Routes
  app.post('/api/marketing/generate-logos', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { businessName, adjectives, logoStyle, colorScheme, industry } = req.body;
      const user = await storage.getUser(userId);
      
      // Generate logo concepts using AI
      const logoPrompt = `Create 4 professional logo concepts for "${businessName}", a ${industry} business in ${user?.country || 'Australia'}. 
        Style: ${logoStyle}. Colors: ${colorScheme}. 
        Personality: ${adjectives.join(', ')}.
        Each logo should include business name and be suitable for business cards, van signage, and uniforms.`;
      
      // Generate actual logo concepts using OpenAI
      const logoResponse = await generateLogoConcept(
        businessName, 
        industry, 
        colorScheme, 
        "professional symbols", 
        logoStyle, 
        user?.country || 'Australia'
      );
      
      const logos = [
        {
          id: "1",
          style: "Modern Text Logo",
          description: `Clean ${businessName} text with professional ${colorScheme} styling`,
          imageUrl: "/placeholder-logo-1.png",
          concept: logoResponse
        },
        {
          id: "2", 
          style: "Icon + Text Logo",
          description: `${industry} symbol with ${businessName} text in ${colorScheme}`,
          imageUrl: "/placeholder-logo-2.png",
          concept: logoResponse
        },
        {
          id: "3",
          style: "Badge Style Logo", 
          description: `Circular badge design with ${businessName} and ${industry} elements`,
          imageUrl: "/placeholder-logo-3.png",
          concept: logoResponse
        },
        {
          id: "4",
          style: "Minimalist Logo",
          description: `Simple, clean ${businessName} design in ${colorScheme}`,
          imageUrl: "/placeholder-logo-4.png",
          concept: logoResponse
        }
      ];
      
      // Mark logo created milestone when user generates logo concepts
      await JourneyTracker.updateMilestone({
        userId,
        milestoneId: "logo_created",
        completed: true
      });

      res.json({ logos, prompt: logoPrompt, aiConcept: logoResponse });
    } catch (error) {
      console.error("Logo generation error:", error);
      res.status(500).json({ message: "Failed to generate logos" });
    }
  });

  app.post('/api/marketing/download-logo', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const { logoId } = req.body;
      
      // In a real implementation, this would generate and return a downloadable logo file
      const downloadUrl = `data:image/svg+xml;base64,${Buffer.from(`
        <svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="100" fill="#2563eb"/>
          <text x="100" y="55" font-family="Arial" font-size="18" fill="white" text-anchor="middle">Sample Logo</text>
        </svg>
      `).toString('base64')}`;
      
      res.json({ 
        success: true, 
        downloadUrl,
        message: "Logo downloaded successfully" 
      });
    } catch (error) {
      console.error("Logo download error:", error);
      res.status(500).json({ message: "Failed to download logo" });
    }
  });

  // Logo file upload endpoint
  app.post('/api/upload-logo', isSimpleAuthenticated, async (req: any, res) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      // For now, we'll just save the logo concept as a text description
      // In a real implementation, you'd handle the file upload to cloud storage
      const businessName = req.body.businessName || 'Business';
      const logoDescription = `Uploaded logo for ${businessName}`;
      
      // Update user with business logo information
      await storage.updateUser(req.user.claims.sub, {
        businessLogo: logoDescription
      });

      // Mark logo created milestone
      await JourneyTracker.updateMilestone({
        userId: req.user.claims.sub,
        milestoneId: "logo_created", 
        completed: true
      });

      // Auto-detect milestones to update profile completion
      await JourneyTracker.autoDetectMilestones(req.user.claims.sub);

      res.json({
        success: true,
        message: "Logo uploaded successfully!",
        logoDescription
      });
    } catch (error) {
      console.error("Logo upload error:", error);
      res.status(500).json({ message: "Failed to upload logo" });
    }
  });

  // Year-end summary route
  app.get('/api/year-end-summary/:year?', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const year = req.params.year ? parseInt(req.params.year) : undefined;
      
      const summary = await storage.getYearEndSummary(userId, year);
      res.json(summary);
    } catch (error: any) {
      console.error("Error getting year-end summary:", error);
      res.status(500).json({ message: "Failed to get year-end summary" });
    }
  });



  // Expense routes
  app.post('/api/expenses', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = getUserOr401(req, res);
      if (!user) return;
      
      const expenseData = insertExpenseSchema.parse(req.body);
      
      // Ensure userId is set to the authenticated user
      const expenseWithUserId = { ...expenseData, userId: user.id };
      const expense = await storage.createExpense(user.id, expenseWithUserId);
      res.json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.patch('/api/expenses/:id', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const expenseId = parseInt(req.params.id);
      const expenseData = { ...req.body, userId };
      
      const expense = await storage.updateExpense(expenseId, expenseData);
      res.json(expense);
    } catch (error) {
      console.error("Error updating expense:", error);
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.get('/api/expenses', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const expenses = await storage.getExpensesByUser(userId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  // Chat routes
  app.post('/api/chat', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { agentType, message, tone = "casual" } = req.body;
      
      // Get user info for region context and personalization
      const user = await storage.getUser(userId);
      const userCountry = user?.country || "Australia";
      const userTone = user?.tonePreference || tone;
      
      // Get chat history for context
      const history = await storage.getChatHistory(userId, agentType, 10);
      const chatHistory = history.reverse().map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));

      // Save user message
      await storage.createChatMessage({
        userId,
        agentType,
        role: 'user',
        content: message
      });

      // Use hybrid AI system for response generation
      const messages = [
        ...chatHistory,
        { role: 'user' as const, content: message }
      ];

      const aiResponse = await aiService.chat(userId, messages, agentType);

      // Save AI response
      await storage.createChatMessage({
        userId,
        agentType,
        role: 'assistant',
        content: aiResponse.content
      });

      // Mark first AI chat milestone as completed
      await JourneyTracker.markFirstAiChatComplete(userId);

      // Return response in expected format
      const response = {
        message: aiResponse.content,
        tokens_used: aiResponse.tokens_used,
        cost_aud: aiResponse.cost_aud,
        source: aiResponse.source,
        agent: agentType,
        timestamp: new Date().toISOString()
      };

      res.json(response);
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ message: "Failed to process chat message" });
    }
  });

  app.get('/api/chat/:agentType/history', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { agentType } = req.params;
      
      const history = await storage.getChatHistory(userId, agentType, 50);
      res.json(history.reverse()); // Reverse to show oldest first
    } catch (error) {
      console.error("Error fetching chat history:", error);
      res.status(500).json({ message: "Failed to fetch chat history" });
    }
  });

  // Weekly summary route
  app.get('/api/weekly-summary', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get this week's data
      const [weeklyIncome, outstandingInvoices, allJobs] = await Promise.all([
        storage.getWeeklyIncome(userId),
        storage.getOutstandingInvoices(userId),
        storage.getJobsByUser(userId)
      ]);

      // Calculate completed jobs this week
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const completedJobsThisWeek = allJobs.filter(job => 
        job.status === 'completed' && new Date(job.updatedAt || job.createdAt || new Date()) >= oneWeekAgo
      );

      // Calculate new customers this week
      const newCustomers = new Set(completedJobsThisWeek.map(job => job.customerName)).size;
      const weekNumber = Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));

      res.json({
        totalEarnings: weeklyIncome,
        completedJobs: completedJobsThisWeek.length,
        unpaidInvoices: outstandingInvoices.length,
        newCustomers,
        weekNumber,
        insight: `You've had a productive week with ${completedJobsThisWeek.length} jobs completed!`
      });
    } catch (error) {
      console.error("Error fetching weekly summary:", error);
      res.status(500).json({ message: "Failed to fetch weekly summary" });
    }
  });

  // Stripe payment routes
  app.post("/api/create-payment-intent", isSimpleAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is currently unavailable. Please configure Stripe." });
      }
      
      const { amount } = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "aud",
      });
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Subscription route
  app.post('/api/get-or-create-subscription', isSimpleAuthenticated, async (req: any, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({ message: "Subscription service is currently unavailable. Please configure Stripe." });
      }

      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string, {
          expand: ['payment_intent']
        });

        res.json({
          subscriptionId: subscription.id,
          clientSecret: (invoice as any).payment_intent?.client_secret || null,
        });
        return;
      }

      if (!user.email) {
        throw new Error('No user email on file');
      }

      // Create Stripe customer if not exists
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`.trim() || user.email,
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customerId });
      }

      // Create subscription - requires STRIPE_PRICE_ID in environment
      if (!process.env.STRIPE_PRICE_ID) {
        return res.status(500).json({ 
          error: "Subscription not configured yet. Please contact support." 
        });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: process.env.STRIPE_PRICE_ID,
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, {
        stripeSubscriptionId: subscription.id
      });

      const invoice = subscription.latest_invoice as any;
      res.json({
        subscriptionId: subscription.id,
        clientSecret: invoice.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error('Subscription error:', error);
      return res.status(400).json({ error: { message: error.message } });
    }
  });

  // Contract template route
  app.get('/api/contract-template/:templateType', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { templateType } = req.params;
      const user = await storage.getUser(userId);
      
      const { getContractTemplate } = await import('../client/src/data/contract-templates');
      const template = getContractTemplate(user?.country || "Australia", templateType);
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="${templateType}-${user?.country || 'Australia'}.txt"`);
      res.send(template);
    } catch (error) {
      console.error("Error generating contract template:", error);
      res.status(500).json({ message: "Failed to generate contract template" });
    }
  });

  // Beta status check - now waitlist-only system
  app.get('/api/beta/status', async (req, res) => {
    try {
      const { waitlistService } = await import("./services/waitlist-service");
      const waitlistCount = await waitlistService.getWaitlistCount();
      
      // Beta is full - everyone goes to waitlist
      res.json({
        canJoin: false,
        message: "Beta is full! Join our waitlist for early access when we launch.",
        betaCount: 100,
        waitlistCount,
        betaLimit: 100,
        betaFull: true
      });
    } catch (error) {
      console.error("Error checking beta status:", error);
      res.status(500).json({ message: "Failed to check beta status" });
    }
  });

  // Beta invite validation - deprecated (beta is full)
  app.post('/api/beta/validate-invite', RateLimiter.betaSignup, async (req, res) => {
    try {
      const { code } = req.body ?? {};
      if (typeof code !== "string") {
        return res.status(400).json({ error: "code required" });
      }
      
      // Beta is full - redirect all users to waitlist
      return res.status(400).json({ 
        valid: false, 
        message: "Beta is full! Join our waitlist for early access when we launch.",
        betaFull: true 
      });

      // For now, accept any beta code during beta period
      // In production, implement proper invite code validation
      const validCodes = ['BETA123', 'FOUNDING25', 'PIONEER50', 'BETA2025'];
      const isValidCode = validCodes.some(validCode => 
        code.toUpperCase().startsWith(validCode) || 
        code.toUpperCase().startsWith('BETA')
      );
      
      if (isValidCode) {
        res.json({ 
          valid: true, 
          code,
          nextTier: 'founding',
          tierMessage: 'Welcome to Blue Tradie Beta!'
        });
      } else {
        res.status(400).json({ 
          valid: false, 
          message: "Invalid invite code. Please check your code and try again." 
        });
      }
    } catch (error) {
      console.error("Beta code validation error:", error);
      res.status(500).json({ valid: false, message: "Failed to validate invite" });
    }
  });

  // Beta tier assignment (called during user onboarding)
  app.post('/api/beta/assign-tier', isSimpleAuthenticated, async (req: any, res) => {
    try {
      // Beta tier assignment removed - everyone goes to waitlist
      res.status(400).json({
        success: false,
        message: "Beta is full! Join our waitlist for early access when we launch."
      });
    } catch (error) {
      console.error("Error in beta assignment:", error);
      res.status(500).json({
        success: false,
        message: "Beta tier assignment not available"
      });
    }
  });

  // Referral dashboard route
  app.get('/api/referrals/dashboard', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Mock referral data - in production, this would come from database
      const referralData = {
        referralCode: user.email?.split('@')[0]?.toUpperCase() || 'TRADIE001',
        totalReferrals: 5,
        successfulReferrals: 3,
        totalCredits: 15.00,
        pendingCredits: 5.00,
        foundingMemberStatus: true, // 3+ successful referrals
        discounts: {
          vipWaitlist: true,
          testimonialProvided: false,
          referralCredits: 15.00
        }
      };

      res.json(referralData);
    } catch (error) {
      console.error('Error fetching referral dashboard:', error);
      res.status(500).json({ message: 'Failed to fetch referral data' });
    }
  });



  // Beta Code Management Routes (Admin Only)
  app.get('/api/admin/beta-codes', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Check if user is admin (you can adjust this logic)
      if (!user?.email || !user.email.includes('admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { BetaCodeManager } = await import("./services/betaCodeManager");
      const codes = await BetaCodeManager.getAllCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error fetching beta codes:", error);
      res.status(500).json({ message: "Failed to fetch beta codes" });
    }
  });

  app.post('/api/admin/beta-codes', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.email || !user.email.includes('admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { description, maxUses = 1, expiresAt } = req.body;
      const { BetaCodeManager } = await import("./services/betaCodeManager");
      
      const newCode = await BetaCodeManager.generateCode(
        description, 
        userId, 
        maxUses, 
        expiresAt ? new Date(expiresAt) : undefined
      );
      
      res.json(newCode);
    } catch (error) {
      console.error("Error creating beta code:", error);
      res.status(500).json({ message: "Failed to create beta code" });
    }
  });

  app.post('/api/admin/beta-codes/:id/revoke', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.email || !user.email.includes('admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { id } = req.params;
      const { BetaCodeManager } = await import("./services/betaCodeManager");
      
      await BetaCodeManager.revokeCode(parseInt(id), userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error revoking beta code:", error);
      res.status(500).json({ message: "Failed to revoke beta code" });
    }
  });

  app.post('/api/feedback', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { type, title, description, priority } = req.body;
      
      // For now, just return success (would normally save to database)
      res.json({ 
        id: Date.now(), 
        userId, 
        type, 
        title, 
        description, 
        priority,
        status: 'open',
        createdAt: new Date()
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  // Admin tier management routes
  app.get('/api/admin/tiers', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.email || !user.email.includes('admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { waitlistService } = await import("./services/waitlist-service");
      const waitlistCount = await waitlistService.getWaitlistCount();
      
      res.json({
        tierProgress: { total: { current: 100, max: 100 } },
        waitlistCount,
        tierDistribution: [],
        totalUsers: 100 + waitlistCount
      });
    } catch (error) {
      console.error("Error fetching tier stats:", error);
      res.status(500).json({ message: "Failed to fetch tier statistics" });
    }
  });

  app.post('/api/admin/launch', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.email || !user.email.includes('admin')) {
        return res.status(403).json({ message: "Admin access required" });
      }

      res.json({ 
        success: true, 
        message: "Launch trigger feature deprecated - using waitlist system only",
        launchDate: new Date()
      });
    } catch (error) {
      console.error("Error triggering launch:", error);
      res.status(500).json({ message: "Failed to trigger public launch" });
    }
  });

  app.get('/api/admin/analytics', async (req, res) => {
    try {
      // Get analytics data without beta tier system
      const { waitlistService } = await import("./services/waitlist-service");
      const waitlistCount = await waitlistService.getWaitlistCount();
      
      const [invoiceCount] = await db.select({ count: sql`count(*)` }).from(invoices);
      const [chatCount] = await db.select({ count: sql`count(*)` }).from(chatMessages);
      const [feedbackCount] = await db.select({ count: sql`count(*)` }).from(feedbackSubmissions);
      
      res.json({
        betaUsers: 100, // Beta is full
        waitlistUsers: waitlistCount,
        totalUsers: 100 + waitlistCount,
        totalInvoices: Number(invoiceCount.count),
        totalChatMessages: Number(chatCount.count),
        totalFeedback: Number(feedbackCount.count),
        weeklyGrowth: waitlistCount, // Based on waitlist growth
        topAgents: [
          { name: "💸 Accountant", usage: Math.floor(Math.random() * 100) },
          { name: "📣 Marketing", usage: Math.floor(Math.random() * 100) },
          { name: "🎯 Business Coach", usage: Math.floor(Math.random() * 100) },
          { name: "📜 Legal", usage: Math.floor(Math.random() * 100) }
        ]
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Testimonials
  app.post("/api/testimonials", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const validatedData = insertTestimonialSchema.parse({
        ...req.body,
        userId,
        country: user?.country || 'Australia',
      });
      
      const testimonial = await storage.createTestimonial(validatedData);
      res.json(testimonial);
    } catch (error) {
      console.error("Testimonial creation error:", error);
      res.status(500).json({ error: "Failed to create testimonial" });
    }
  });

  app.get("/api/testimonials/public", async (req, res) => {
    try {
      const testimonials = await storage.getPublicTestimonials();
      res.json(testimonials);
    } catch (error) {
      console.error("Public testimonials fetch error:", error);
      res.status(500).json({ error: "Failed to fetch testimonials" });
    }
  });

  app.get("/api/testimonials/user", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const testimonial = await storage.getUserTestimonial(userId);
      res.json(testimonial);
    } catch (error) {
      console.error("User testimonial fetch error:", error);
      res.status(500).json({ error: "Failed to fetch user testimonial" });
    }
  });

  // Roadmap routes
  app.get("/api/roadmap", async (req, res) => {
    try {
      const publicOnly = req.query.public === "true";
      const items = await storage.getRoadmapItems(publicOnly);
      res.json(items);
    } catch (error) {
      console.error("Roadmap fetch error:", error);
      res.status(500).json({ error: "Failed to fetch roadmap" });
    }
  });

  app.post("/api/roadmap", isSimpleAuthenticated, async (req: any, res) => {
    try {
      // Only allow admin users to create roadmap items
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.email !== "admin@bluetradie.com") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const validatedData = insertRoadmapItemSchema.parse(req.body);
      const item = await storage.createRoadmapItem(validatedData);
      res.json(item);
    } catch (error) {
      console.error("Roadmap creation error:", error);
      res.status(500).json({ error: "Failed to create roadmap item" });
    }
  });

  app.put("/api/roadmap/:id", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.email !== "admin@bluetradie.com") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const id = parseInt(req.params.id);
      const updates = req.body;
      const item = await storage.updateRoadmapItem(id, updates);
      res.json(item);
    } catch (error) {
      console.error("Roadmap update error:", error);
      res.status(500).json({ error: "Failed to update roadmap item" });
    }
  });

  app.post("/api/roadmap/:id/vote", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const itemId = parseInt(req.params.id);
      
      await storage.voteForRoadmapItem(userId, itemId, user?.country || 'Australia');
      res.json({ success: true });
    } catch (error) {
      console.error("Roadmap vote error:", error);
      res.status(500).json({ error: "Failed to vote for roadmap item" });
    }
  });

  app.get("/api/roadmap/votes/user", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const votes = await storage.getUserRoadmapVotes(userId);
      res.json(votes);
    } catch (error) {
      console.error("User votes fetch error:", error);
      res.status(500).json({ error: "Failed to fetch user votes" });
    }
  });

  app.post("/api/feature-requests", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const validatedData = insertFeatureRequestSchema.parse({
        ...req.body,
        userId,
        country: user?.country || 'Australia',
      });
      
      const request = await storage.createFeatureRequest(validatedData);
      res.json(request);
    } catch (error) {
      console.error("Feature request creation error:", error);
      res.status(500).json({ error: "Failed to create feature request" });
    }
  });

  app.get("/api/feature-requests", async (req, res) => {
    try {
      const requests = await storage.getFeatureRequests();
      res.json(requests);
    } catch (error) {
      console.error("Feature requests fetch error:", error);
      res.status(500).json({ error: "Failed to fetch feature requests" });
    }
  });

  // Expenses routes
  app.get('/api/expenses', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const expenses = await storage.getExpensesByUser(userId);
      res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post('/api/expenses', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const expense = await storage.createExpense(userId, req.body);
      res.json(expense);
    } catch (error) {
      console.error("Error creating expense:", error);
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.delete('/api/expenses/:id', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const expenseId = parseInt(req.params.id);
      await storage.deleteExpense(userId, expenseId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting expense:", error);
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  app.get("/api/admin/roadmap-analytics", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.email !== "admin@bluetradie.com") {
        return res.status(403).json({ error: "Admin access required" });
      }

      const analytics = await storage.getRoadmapAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Roadmap analytics error:", error);
      res.status(500).json({ error: "Failed to fetch roadmap analytics" });
    }
  });

  // Business Journey routes
  app.get('/api/journey', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Auto-detect milestones on journey access
      await JourneyTracker.autoDetectMilestones(userId);
      
      // Get updated user data
      const updatedUser = await storage.getUser(userId);
      
      res.json({
        currentStage: updatedUser?.currentJourneyStage || 1,
        completedMilestones: updatedUser?.completedMilestones || [],
        stageName: JourneyTracker.getStageName(updatedUser?.currentJourneyStage || 1)
      });
    } catch (error) {
      console.error("Journey fetch error:", error);
      res.status(500).json({ message: "Failed to fetch journey data" });
    }
  });

  app.post('/api/journey/milestone', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { milestoneId, completed } = req.body;
      
      const updatedUser = await JourneyTracker.updateMilestone({
        userId,
        milestoneId,
        completed
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        currentStage: updatedUser.currentJourneyStage,
        completedMilestones: updatedUser.completedMilestones,
        stageName: JourneyTracker.getStageName(updatedUser.currentJourneyStage || 1)
      });
    } catch (error) {
      console.error("Milestone update error:", error);
      res.status(500).json({ message: "Failed to update milestone" });
    }
  });

  // Communication tone preference route
  app.post('/api/user/communication-tone', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { communicationTone } = req.body;
      
      const updatedUser = await storage.updateUserProfile(userId, {
        communicationTone
      });
      
      res.json({ success: true, communicationTone: updatedUser?.communicationTone });
    } catch (error) {
      console.error("Communication tone update error:", error);
      res.status(500).json({ message: "Failed to update communication tone" });
    }
  });

  // ===== TRIAL MANAGEMENT ROUTES =====
  
  // Start free trial for user
  app.post('/api/trial/start', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { customDurationDays } = req.body;
      
      // Check if user is eligible
      const isEligible = await trialService.isEligibleForTrial(userId);
      if (!isEligible) {
        return res.status(400).json({ 
          message: "User is not eligible for trial (already used trial or has beta access)" 
        });
      }
      
      const user = await trialService.startTrial(userId, customDurationDays);
      if (!user) {
        return res.status(500).json({ message: "Failed to start trial" });
      }
      
      res.json({ 
        message: "Trial started successfully",
        trialEndDate: user.trialEndDate,
        durationDays: user.trialDurationDays
      });
    } catch (error) {
      console.error("Start trial error:", error);
      res.status(500).json({ message: "Failed to start trial" });
    }
  });
  
  // Get trial status for authenticated user
  app.get('/api/trial/status', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const status = await trialService.getTrialStatus(userId);
      res.json(status);
    } catch (error) {
      console.error("Trial status error:", error);
      res.status(500).json({ message: "Failed to get trial status" });
    }
  });
  
  // Check if beta period is over and trial system should be active
  app.get('/api/trial/system-status', async (req, res) => {
    try {
      const betaUsers = await storage.getBetaUserCount();
      const isBetaFull = betaUsers >= 100;
      const trialSystemActive = isBetaFull;
      
      res.json({
        trialSystemActive,
        betaUserCount: betaUsers,
        betaCapacity: 100,
        isBetaFull,
        message: trialSystemActive 
          ? "Trial system is active - new users get 14-day free trial"
          : `Beta is open (${betaUsers}/100 users) - new users can join beta`
      });
    } catch (error) {
      console.error("Trial system status error:", error);
      res.status(500).json({ message: "Failed to get trial system status" });
    }
  });
  
  // Admin: Get trial analytics
  app.get('/api/admin/trial-analytics', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.email !== "admin@bluetradie.com") {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const analytics = await trialService.getTrialAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Trial analytics error:", error);
      res.status(500).json({ error: "Failed to fetch trial analytics" });
    }
  });
  
  // Admin: Update trial duration setting
  app.post('/api/admin/trial-duration', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.email !== "admin@bluetradie.com") {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { durationDays } = req.body;
      if (!durationDays || durationDays < 1 || durationDays > 90) {
        return res.status(400).json({ error: "Invalid trial duration (1-90 days)" });
      }
      
      const success = await trialService.updateTrialDuration(durationDays);
      if (!success) {
        return res.status(500).json({ error: "Failed to update trial duration" });
      }
      
      res.json({ message: "Trial duration updated successfully", durationDays });
    } catch (error) {
      console.error("Trial duration update error:", error);
      res.status(500).json({ error: "Failed to update trial duration" });
    }
  });

  // Register analytics routes
  registerAnalyticsRoutes(app);
  
  // Register demo routes
  registerDemoRoutes(app);
  
  // Register Stripe webhook routes
  registerStripeWebhookRoutes(app);
  registerSubscriptionRoutes(app);
  
  // Register invoice payment routes
  registerInvoiceRoutes(app);
  
  // Waitlist automation routes removed - functionality integrated into waitlist-service
  
  // Register demo magic link routes
  const demoMagicLinkRoutes = await import('./routes/demo-magic-link');
  app.use('/', demoMagicLinkRoutes.default);
  
  // Register admin email panel routes
  const adminEmailPanelRoutes = await import('./routes/admin-email-panel');
  app.use('/internal', adminEmailPanelRoutes.default);

  // Register admin signup monitoring routes
  const adminSignupRoutes = await import('./routes/admin-signups');
  app.use('/internal', adminSignupRoutes.default);

  // Import and register development trigger routes
  const developmentTriggerRoutes = await import('./routes/development-trigger');
  app.use('/api/dev-trigger', developmentTriggerRoutes.default);
  
  // Admin: Manual trial email processing (for testing/debugging)
  app.post('/api/admin/process-trial-emails', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.email !== "admin@bluetradie.com") {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const { emailService } = await import('./services/sendgrid-email-service');
      const { day10Users, day13Users, day14Users } = await trialService.getUsersForTrialEmails();
      
      let results = {
        day10: { sent: 0, failed: 0 },
        day13: { sent: 0, failed: 0 },
        day14: { sent: 0, failed: 0 },
      };
      
      // Process Day 10 reminders
      for (const user of day10Users) {
        const wasAlreadySent = await trialService.wasEmailSent(user.id, "day_10_reminder");
        if (!wasAlreadySent && user.email) {
          const sent = await emailService.sendEmail({
            to: user.email,
            subject: "Blue Tradie Trial - Day 10 Reminder",
            html: `<h1>Your trial expires soon!</h1><p>Hi ${user.firstName || user.email},</p><p>Your Blue Tradie trial expires in a few days. Don't miss out!</p>`
          });
          if (sent) {
            await trialService.recordTrialEmail(user.id, "day_10_reminder");
            results.day10.sent++;
          } else {
            results.day10.failed++;
          }
        }
      }
      
      // Process Day 13 reminders  
      for (const user of day13Users) {
        const wasAlreadySent = await trialService.wasEmailSent(user.id, "day_13_final");
        if (!wasAlreadySent && user.email) {
          const sent = await emailService.sendEmail({
            to: user.email,
            subject: "Blue Tradie Trial - Final Reminder", 
            html: `<h1>Last chance!</h1><p>Hi ${user.firstName || user.email},</p><p>Your Blue Tradie trial expires today. Upgrade now to keep your access!</p>`
          });
          if (sent) {
            await trialService.recordTrialEmail(user.id, "day_13_final");
            results.day13.sent++;
          } else {
            results.day13.failed++;
          }
        }
      }
      
      // Process Day 14 lockouts
      for (const user of day14Users) {
        const wasAlreadySent = await trialService.wasEmailSent(user.id, "day_14_lockout");
        if (!wasAlreadySent && user.email) {
          const sent = await emailService.sendEmail({
            to: user.email,
            subject: "Blue Tradie Trial - Account Locked",
            html: `<h1>Trial expired</h1><p>Hi ${user.firstName || user.email},</p><p>Your Blue Tradie trial has expired. Upgrade to continue using our services.</p>`
          });
          if (sent) {
            await trialService.recordTrialEmail(user.id, "day_14_lockout");
            results.day14.sent++;
          } else {
            results.day14.failed++;
          }
        }
        
        // Expire the trial
        await trialService.expireTrial(user.id);
      }
      
      res.json({
        message: "Trial email processing completed",
        results,
        usersProcessed: {
          day10: day10Users.length,
          day13: day13Users.length, 
          day14: day14Users.length
        }
      });
    } catch (error) {
      console.error("Process trial emails error:", error);
      res.status(500).json({ error: "Failed to process trial emails" });
    }
  });

  // Business setup endpoints
  app.get('/api/user/setup-status', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Return setup status based on stored status flags
      const setupStatus = {
        businessDetails: user?.business_details_status === 'completed' || (!!user?.businessName && !!(user as any)?.phone),
        abnRegistration: user?.abn_registration_status === 'completed' || !!(user as any)?.abn,
        businessName: user?.business_name_status === 'completed' || !!user?.businessName,
        gstRegistration: user?.gst_registration_status === 'completed' || (user as any)?.gstStatus === 'registered',
        businessBanking: user?.bank_account_status === 'completed' || !!(user as any)?.bankDetails,
        insurance: user?.insurance_setup_status === 'completed' || (user as any)?.insuranceSetup || false,
        taxSetup: user?.tax_setup_status === 'completed' || (user as any)?.taxSetup || false
      };
      
      res.json(setupStatus);
    } catch (error) {
      console.error("Error fetching setup status:", error);
      res.status(500).json({ message: "Failed to fetch setup status" });
    }
  });

  app.post('/api/user/update-setup', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { itemId, status, details } = req.body;
      
      let updateData: any = {};
      
      if (details) {
        updateData = {
          ...details,
          [`${itemId}_status`]: status,
          [`${itemId}_updated`]: new Date()
        };
      } else {
        updateData[`${itemId}_status`] = status;
        updateData[`${itemId}_updated`] = new Date();
      }
      
      console.log("Update setup - userId:", userId, "itemId:", itemId, "status:", status, "updateData:", updateData);
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      console.log("Update setup - User updated successfully. New status fields:", {
        abn_registration_status: updatedUser.abn_registration_status,
        business_details_status: updatedUser.business_details_status,
        business_name_status: updatedUser.business_name_status
      });
      
      res.json({ 
        success: true, 
        message: "Setup item updated successfully"
      });
    } catch (error) {
      console.error("Error updating setup:", error);
      res.status(500).json({ message: "Failed to update setup" });
    }
  });

  // Goals setup endpoint
  app.post('/api/goals/setup', isSimpleAuthenticated, async (req: any, res) => {
    try {
      console.log("Goals setup endpoint called for user:", req.user?.claims?.sub);
      const userId = req.user.claims.sub;
      const {
        userType,
        gender,
        businessStructure,
        tonePreference,
        financial,
        work,
        personal,
        vision
      } = req.body;

      // Create vision sentence from the vision fields
      let visionSentence = "";
      if (vision && vision.timeframe && vision.keyResult && vision.whyImportant) {
        visionSentence = `It is now ${vision.timeframe}. I am/I have ${vision.keyResult}. This goal is really important because ${vision.whyImportant}.`;
      } else {
        // Fallback vision creation
        visionSentence = `I'm building a successful business that generates $${financial.monthlyTarget} per month, allowing me to ${personal.holidayActivity} and afford ${personal.purchase}.`;
      }

      // Prepare goals data
      const goalsData = {
        financial,
        work,
        personal,
        vision
      };

      console.log("Goals setup - About to update user with data:", {
        userId,
        goalsData,
        userType: userType || 'tradie',
        visionSentence
      });

      // Update user with goals data
      const updatedUser = await storage.updateUser(userId, {
        userType: userType || 'tradie',
        gender: gender || 'male',
        businessStructure: businessStructure || 'solo',
        tonePreference: tonePreference || 'casual',
        goals: goalsData,
        visionSentence
      });

      console.log("Goals setup - User updated with goals:", {
        userId,
        hasGoals: !!updatedUser?.goals,
        goalsData: updatedUser?.goals
      });

      // Mark goals milestones as complete in journey tracker
      await JourneyTracker.updateMilestone({
        userId,
        milestoneId: "goals_onboarding_completed",
        completed: true
      });

      // Directly mark goals_set milestone as complete
      const milestoneResult = await JourneyTracker.updateMilestone({
        userId,
        milestoneId: "goals_set",
        completed: true
      });

      console.log("Goals setup - Milestone update result:", {
        userId,
        milestoneResult: milestoneResult ? {
          id: milestoneResult.id,
          completedMilestones: milestoneResult.completedMilestones,
          currentJourneyStage: milestoneResult.currentJourneyStage
        } : null
      });

      // Fetch the updated user data to confirm goals were saved
      const finalUser = await storage.getUser(userId);
      
      res.json({ 
        success: true,
        message: "Goals setup completed successfully",
        visionSentence,
        user: finalUser
      });
    } catch (error) {
      console.error("Error setting up goals:", error);
      res.status(500).json({ message: "Failed to setup goals" });
    }
  });

  // Logo generation endpoint for marketing agent
  app.post('/api/generate-logo', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const { businessName, style, colors, symbolIdeas, prompt } = req.body;
      
      if (!businessName) {
        return res.status(400).json({ message: "Business name is required" });
      }
      
      // Create a comprehensive logo generation prompt
      const logoPrompt = `Create a professional logo for "${businessName}" business:
Style: ${style || 'Modern and professional'}
Colors: ${colors || 'Blue and grey professional palette'}
Symbol ideas: ${symbolIdeas || 'Business-related icons'}
Additional requirements: ${prompt || 'Clean, readable, scalable design suitable for business cards and signage'}

Design should be simple, memorable, and work well in both color and black & white versions.`;
      
      // Update user with business logo information and mark milestone complete
      await storage.updateUser(req.user.claims.sub, {
        businessLogo: `Logo concept: ${style || 'Modern'} style in ${colors || 'blue and grey'} for ${businessName}`
      });

      // Mark logo created milestone
      await JourneyTracker.updateMilestone({
        userId: req.user.claims.sub,
        milestoneId: "logo_created", 
        completed: true
      });

      // Auto-detect milestones to update profile completion
      await JourneyTracker.autoDetectMilestones(req.user.claims.sub);

      res.json({
        success: true,
        logoPrompt,
        message: "Logo concept generated! This would integrate with AI image generation to create actual logo designs.",
        suggestions: [
          "Try different color combinations",
          "Consider industry-specific symbols", 
          "Test readability at small sizes",
          "Create variations for different uses"
        ]
      });
    } catch (error) {
      console.error("Error generating logo:", error);
      res.status(500).json({ message: "Failed to generate logo" });
    }
  });

  // Logo generation endpoint
  app.post("/api/generate-logo", isSimpleAuthenticated, async (req: any, res) => {
    try {
      const { businessName, preferredColors, style, symbolIdeas } = req.body;
      
      // For now, just store the logo details (AI logo generation would be implemented later)
      const logoDetails = {
        businessName,
        preferredColors,
        style,
        symbolIdeas,
        status: "concept_created",
        createdAt: new Date().toISOString()
      };
      
      res.json({ 
        success: true,
        message: `Logo concept created for ${businessName}! We've saved your preferences: ${style} style with ${preferredColors} colors. Our Marketing AI can help refine this further.`,
        logoDetails 
      });
    } catch (error) {
      console.error("Error creating logo concept:", error);
      res.status(500).json({ error: "Failed to create logo concept" });
    }
  });

  // Email Testing Routes (for beta launch preparation)
  app.post('/api/test/email', async (req: any, res) => {
    try {
      const { testEmail } = req.body;
      if (!testEmail) {
        return res.status(400).json({ success: false, message: "Test email address is required" });
      }

      const { emailService } = await import('./services/sendgrid-email-service');
      const success = await emailService.sendEmail({ 
        to: testEmail, 
        from: process.env.FROM_EMAIL ?? "noreply@bluetradie.com", 
        subject: "Blue Tradie Test Email", 
        html: "<p>This is a test email from Blue Tradie!</p>" 
      });
      
      res.json({ 
        success, 
        message: success ? "Test email sent successfully!" : "Email send failed. Check console for details.",
        testMode: emailService.getServiceStatus().testMode
      });
    } catch (error) {
      console.error("Email test error:", error);
      res.status(500).json({ success: false, message: "Email test failed" });
    }
  });

  app.post('/api/test/welcome-email', async (req: any, res) => {
    try {
      const { testEmail, tier = 'founding', firstName = 'Test', country = 'Australia', businessName = 'Test Tradie Business' } = req.body;
      if (!testEmail) {
        return res.status(400).json({ success: false, message: "Test email address is required" });
      }

      const { emailService } = await import('./services/sendgrid-email-service');
      const testUserData = { firstName, email: testEmail, tier: tier as 'founding' | 'earlySupporter' | 'betaTester', country, businessName };
      const success = await emailService.sendEmail({ 
        to: testEmail, 
        from: process.env.FROM_EMAIL ?? "noreply@bluetradie.com", 
        subject: `Welcome to Blue Tradie - ${tier} Member!`, 
        html: `<h1>Welcome ${firstName}!</h1><p>Thank you for joining Blue Tradie as a ${tier} member.</p><p>Business: ${businessName}</p>` 
      });
      
      res.json({ 
        success, 
        message: success ? `${tier} tier welcome email sent successfully!` : "Welcome email send failed.",
        tierData: testUserData,
        testMode: emailService.getServiceStatus().testMode
      });
    } catch (error) {
      console.error("Welcome email test error:", error);
      res.status(500).json({ success: false, message: "Welcome email test failed" });
    }
  });

  app.get('/api/test/email-status', async (req: any, res) => {
    try {
      const { emailService } = await import('./services/sendgrid-email-service');
      const hasTransporter = emailService.getServiceStatus().isActive;
      
      let provider = 'None configured';
      if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
        provider = 'Gmail';
      } else if (process.env.OUTLOOK_USER && process.env.OUTLOOK_PASSWORD) {
        provider = 'Outlook';  
      } else if (process.env.SMTP_HOST) {
        provider = 'Custom SMTP';
      }

      res.json({
        emailServiceActive: hasTransporter,
        testMode: !hasTransporter,
        provider,
        configuration: {
          hasGmail: !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
          hasOutlook: !!(process.env.OUTLOOK_USER && process.env.OUTLOOK_PASSWORD),
          hasCustomSMTP: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
          fromEmail: process.env.FROM_EMAIL || 'noreply@bluetradie.com'
        }
      });
    } catch (error) {
      console.error("Email status check error:", error);
      res.status(500).json({ success: false, message: "Failed to check email status" });
    }
  });

  // Usage monitoring endpoints (admin only)
  app.get('/api/admin/usage-stats', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      // Simple admin check - in production use proper admin middleware
      if (!user || !user.email?.includes('admin')) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      const stats = usageMonitor.getStats();
      
      res.json({
        ...stats,
        reportGenerated: new Date().toISOString(),
        status: usageMonitor.isOverLimit() ? 'OVER_LIMIT' : 
               stats.percentages.apiCalls > 80 ? 'APPROACHING_LIMIT' : 'NORMAL'
      });
    } catch (error) {
      console.error('Usage stats error:', error);
      res.status(500).json({ error: 'Failed to get usage stats' });
    }
  });

  app.post('/api/admin/usage-reset', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email?.includes('admin')) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      usageMonitor.resetDailyStats();
      
      res.json({
        success: true,
        message: 'Usage stats reset successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Usage reset error:', error);
      res.status(500).json({ error: 'Failed to reset usage stats' });
    }
  });

  // Demo user management routes
  app.post('/api/demo/create', async (req, res) => {
    try {
      const { email, firstName, lastName, businessName, trade, serviceArea, country, durationDays, tokenLimit } = req.body;
      
      const demoUser = await demoService.createDemoUser({
        email,
        firstName,
        lastName,
        businessName,
        trade,
        serviceArea,
        country: country || 'Australia',
        durationDays: durationDays || 14,
        tokenLimit: tokenLimit || 1000
      });

      res.json({
        success: true,
        user: {
          id: demoUser.id,
          email: demoUser.email,
          expiresAt: demoUser.demoExpiresAt,
          tokenLimit: demoUser.demoTokenLimit
        }
      });
    } catch (error) {
      console.error("Error creating demo user:", error);
      res.status(500).json({ message: "Failed to create demo user" });
    }
  });

  app.get('/api/demo/status/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const status = await demoService.getDemoStatus(userId);
      res.json(status);
    } catch (error) {
      console.error("Error getting demo status:", error);
      res.status(500).json({ message: "Failed to get demo status" });
    }
  });

  app.post('/api/demo/extend/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { additionalDays, additionalTokens } = req.body;
      
      const updatedUser = await demoService.extendDemo(userId, additionalDays || 7, additionalTokens || 0);
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Error extending demo:", error);
      res.status(500).json({ message: "Failed to extend demo" });
    }
  });

  app.get('/api/demo/token-usage', unifiedAuth, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await AITokenService.getUsageStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error getting token usage:", error);
      res.status(500).json({ message: "Failed to get token usage" });
    }
  });

  // Token stats endpoint for frontend components
  app.get('/api/ai/token-stats', isSimpleAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Get user to check if demo user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // For demo users, return static 1M token allocation
      if (user.isDemoUser || user.demoTokenLimit) {
        return res.json({
          monthlyLimit: user.demoTokenLimit || 1000000,
          tokensUsed: user.demoTokensUsed || 0,
          tokensRemaining: (user.demoTokenLimit || 1000000) - (user.demoTokensUsed || 0),
          totalCostAud: 0,
          usagePercentage: ((user.demoTokensUsed || 0) / (user.demoTokenLimit || 1000000)) * 100
        });
      }
      
      const stats = await aiService.getTokenStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error getting token stats:", error);
      res.status(500).json({ message: "Failed to get token stats" });
    }
  });

  // System health check endpoint
  app.get('/api/system/health', async (req, res) => {
    try {
      const { SystemHealthChecker } = await import('./services/system-health');
      const healthCheck = await SystemHealthChecker.runFullSystemCheck();
      res.json(healthCheck);
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({ 
        status: 'error',
        message: 'Health check failed',
        error: error
      });
    }
  });

  // Quick health status for dashboard
  app.get('/api/system/status', async (req, res) => {
    try {
      const { SystemHealthChecker } = await import('./services/system-health');
      const status = await SystemHealthChecker.quickHealthCheck();
      res.json(status);
    } catch (error) {
      console.error("Status check error:", error);
      res.status(500).json({ 
        database: false, 
        storage: false, 
        ai: false, 
        email: false 
      });
    }
  });

  // UGC bonus endpoint  
  app.post('/api/demo/ugc-bonus', async (req, res) => {
    try {
      const { userId, ugcType, bonusTokens } = req.body;
      const updatedUser = await demoService.awardUGCBonus(userId, ugcType, bonusTokens);
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Error awarding UGC bonus:", error);
      res.status(500).json({ message: "Failed to award UGC bonus" });
    }
  });

  // Auto-demo endpoints
  app.post('/api/demo/auto-offer', async (req, res) => {
    try {
      const { userId, userEmail } = req.body;
      const { AutoDemoService } = await import('./services/auto-demo-service');
      const result = await AutoDemoService.offerDemoToNewUser(userId, userEmail);
      res.json(result);
    } catch (error) {
      console.error("Error offering auto demo:", error);
      res.status(500).json({ message: "Failed to offer demo" });
    }
  });

  app.post('/api/demo/activate', async (req, res) => {
    try {
      const { userId, demoCode } = req.body;
      const { AutoDemoService } = await import('./services/auto-demo-service');
      const result = await AutoDemoService.activateDemo(userId, demoCode);
      res.json(result);
    } catch (error) {
      console.error("Error activating demo:", error);
      res.status(500).json({ message: "Failed to activate demo" });
    }
  });

  app.get('/api/demo/stats', async (req, res) => {
    try {
      const { AutoDemoService } = await import('./services/auto-demo-service');
      const stats = await AutoDemoService.getDemoStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting demo stats:", error);
      res.status(500).json({ message: "Failed to get demo stats" });
    }
  });

  // Email test route for demo admin
  app.post('/api/email-test/send-welcome', async (req, res) => {
    try {
      const { testEmail, firstName = 'Test User', businessName = 'Test Business', trade = 'Electrician', country = 'Australia' } = req.body;
      
      if (!testEmail) {
        return res.status(400).json({ success: false, message: "Test email address is required" });
      }

      // Use sendgrid email service instead of welcome-email
      const { emailService } = await import('./services/sendgrid-email-service');
      
      const emailContent = {
        subject: `Welcome to Blue Tradie, ${firstName}!`,
        html: `
          <h1>Welcome ${firstName}!</h1>
          <p>Thank you for joining Blue Tradie!</p>
          <p><strong>Business:</strong> ${businessName}</p>
          <p><strong>Trade:</strong> ${trade}</p>
          <p><strong>Country:</strong> ${country}</p>
          <p>We're excited to help your business grow!</p>
        `
      };

      // Send email using emailService
      try {
        const success = await emailService.sendEmail({
          to: testEmail,
          from: process.env.FROM_EMAIL ?? "noreply@bluetradie.com",
          subject: emailContent.subject,
          html: emailContent.html
        });
        
        console.log(`📧 Test welcome email sent to: ${testEmail}`);
        res.json({ 
          success, 
          message: success ? "Test welcome email sent successfully! Check your inbox." : "Email send failed.",
          timestamp: new Date().toISOString()
        });
      } catch (emailError) {
        console.log("SendGrid not available, showing email content in console:");
        console.log("=".repeat(80));
        console.log(`Subject: Welcome to Blue Tradie Beta, ${firstName}!`);
        console.log("=".repeat(80));
        console.log(emailContent);
        console.log("=".repeat(80));
        
        res.json({ 
          success: true, 
          message: "Email system in test mode - check server console for email content",
          testMode: true,
          timestamp: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error("Email test error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Email test failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Demo test login (bypasses Replit Auth for testing)
  app.post('/api/demo/login', async (req, res) => {
    const { username, password } = req.body;
    
    // Simple test credentials - perfect for Replit testing
    const testUsers: Record<string, { password: string; userData: any }> = {
      'demo': { 
        password: 'demo123', 
        userData: { 
          id: `demo-user-${Date.now()}`, // Fresh ID each time
          firstName: 'Demo', 
          lastName: 'User', 
          email: 'demo@bluetradie.com', 
          country: 'Australia', 
          trade: 'Electrician',
          businessName: 'Demo Electrical Services',
          profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
          tokenBalance: 200,
          subscriptionTier: 'Blue Lite Demo',
          isOnboarded: false // Start fresh for onboarding testing
        }
      },
      'ra': { 
        password: 'vip12', 
        userData: { 
          id: 'ra-vip-user', 
          firstName: 'Ra', 
          lastName: 'TestUser', 
          email: 'ra@bluetradie.com', 
          country: 'New Zealand', 
          trade: 'Builder',
          businessName: 'Ra Building Services',
          profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ra',
          tokenBalance: 200,
          subscriptionTier: 'VIP Demo Access'
        }
      },
      'test': { 
        password: 'test123', 
        userData: { 
          id: 'test-user-002', 
          firstName: 'Test', 
          lastName: 'Tradie', 
          email: 'test@bluetradie.com', 
          country: 'Australia', 
          trade: 'Plumber',
          businessName: 'Test Plumbing Co',
          profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
          tokenBalance: 200,
          subscriptionTier: 'Blue Lite Demo'
        }
      },
      'cy': { 
        password: 'vip13', 
        userData: { 
          id: 'cy-vip-user', 
          firstName: 'Cy', 
          lastName: 'User', 
          email: 'cy@bluetradie.com', 
          country: 'Australia', 
          trade: 'Electrician',
          businessName: 'Cy Electrical Services',
          profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=cy',
          tokenBalance: 200,
          subscriptionTier: 'VIP Demo Access'
        }
      }
    };
    
    if (testUsers[username] && testUsers[username].password === password) {
      // Set session data
      req.session.testUser = testUsers[username].userData;
      req.session.isTestAuthenticated = true;
      
      console.log(`[TEST LOGIN] User ${username} logged in successfully`);
      
      // Check if request expects HTML (browser) or JSON (API)
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        // Browser request - redirect to dashboard
        res.redirect('/');
      } else {
        // API request - return JSON
        res.json({ 
          success: true, 
          message: 'Test login successful',
          user: testUsers[username].userData,
          redirect: '/'
        });
      }
    } else {
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        res.redirect('/login?error=invalid');
      } else {
        res.status(401).json({ success: false, message: 'Invalid test credentials' });
      }
    }
  });

  // Test logout endpoint
  app.post('/api/demo/logout', async (req, res) => {
    req.session.testUser = null;
    req.session.isTestAuthenticated = false;
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // Test auth check endpoint 
  app.get('/api/demo/user', async (req, res) => {
    if (req.session.isTestAuthenticated && req.session.testUser) {
      res.json(req.session.testUser);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Serve the test login page
  app.get('/test-login', (req, res) => {
    res.sendFile(path.join(__dirname, '../test-login.html'));
  });

  // Serve the quick demo page (easiest access)
  app.get('/quick-demo', (req, res) => {
    res.sendFile(path.join(__dirname, '../quick-demo.html'));
  });

  // Direct access route that bypasses login and goes straight to demo dashboard
  app.get('/direct-demo', async (req, res) => {
    // Auto-login as demo user and redirect
    req.session.testUser = {
      id: 'demo-user-001', 
      firstName: 'Demo', 
      lastName: 'User', 
      email: 'demo@bluetradie.com', 
      country: 'Australia', 
      trade: 'Electrician',
      businessName: 'Demo Electrical Services',
      profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      tokenBalance: 200,
      subscriptionTier: 'Blue Lite Demo'
    };
    req.session.isTestAuthenticated = true;
    
    res.redirect('/demo-dashboard');
  });

  // Public waitlist functionality disabled for live app testing
  app.post("/api/public-notify", async (req, res) => {
    res.status(503).json({ 
      error: 'Waitlist functionality disabled during live testing',
      status: 'disabled'
    });
  });

  // One-time database migration endpoint
  app.post('/api/admin/migrate', async (req, res) => {
    try {
      console.log('[MIGRATION] Running database schema migration...');
      
      // Import and run the drizzle push command
      const { exec } = await import('child_process');
      
      exec('npm run db:push', (error, stdout, stderr) => {
        if (error) {
          console.error('[MIGRATION] Error:', error);
          return res.status(500).json({
            success: false,
            message: 'Migration failed',
            error: error.message
          });
        }
        
        console.log('[MIGRATION] Success:', stdout);
        res.json({
          success: true,
          message: 'Database migration completed successfully!',
          output: stdout
        });
      });
      
    } catch (error) {
      console.error('[MIGRATION] Exception:', error);
      res.status(500).json({
        success: false,
        message: 'Migration failed',
        error: (error as Error).message
      });
    }
  });

  // Register health check routes
  registerHealthRoutes(app);
  
  // Register client portal routes
  registerClientPortalRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
