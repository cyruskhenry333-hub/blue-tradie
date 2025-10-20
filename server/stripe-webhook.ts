import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const STRIPE_VERIFY_DISABLED =
  (process.env.STRIPE_VERIFY_DISABLED || "").toLowerCase() === "true";

const stripe = new Stripe(STRIPE_SECRET_KEY || "sk_dummy", { apiVersion: "2024-06-20" });

// Simple event deduplication store
const processedEvents = new Set<string>();

export function mountStripeWebhook(app: express.Express) {
  console.log("[STRIPE] Mounting canonical webhook routes");
  
  // Ping endpoint for health checks
  app.get("/api/stripe/webhook/ping", (_req, res) => {
    res.json({
      ok: true,
      verifyDisabled: STRIPE_VERIFY_DISABLED,
      hasWebhookSecret: Boolean(STRIPE_WEBHOOK_SECRET),
    });
  });

  // Canonical webhook handler
  const webhookHandler = async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];
    const isBuf = Buffer.isBuffer(req.body);

    console.log("[STRIPE DEBUG ENTER]", {
      method: req.method,
      path: req.originalUrl,
      hasSig: !!sig,
      isBuffer: isBuf,
      len: isBuf ? (req.body as Buffer).length : -1,
      ct: req.headers["content-type"],
      verifyDisabled: STRIPE_VERIFY_DISABLED,
    });

    if (STRIPE_VERIFY_DISABLED) {
      console.log("[STRIPE BYPASS] verification disabled, returning 200");
      return res.status(200).send("ok: verification disabled");
    }

    if (!sig || !STRIPE_WEBHOOK_SECRET) {
      return res.status(400).send("Missing Stripe signature or webhook secret");
    }
    if (!isBuf) {
      return res.status(400).send("Stripe webhook requires raw body (Buffer)");
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        String(sig),
        STRIPE_WEBHOOK_SECRET
      );

      // Idempotency check
      if (processedEvents.has(event.id)) {
        console.log(`[STRIPE SKIP] Event ${event.id} already processed`);
        return res.status(200).send("ok: already processed");
      }

      console.log("[STRIPE OK]", { type: event.type, id: event.id });

      // Handle events
      try {
        await handleStripeEvent(event);
        processedEvents.add(event.id);
        
        // Cleanup old events (keep last 1000)
        if (processedEvents.size > 1000) {
          const oldEvents = Array.from(processedEvents).slice(0, -1000);
          oldEvents.forEach(id => processedEvents.delete(id));
        }
      } catch (error) {
        console.error(`[STRIPE ERROR] Processing event ${event.id}:`, error);
        // Still return 200 to acknowledge receipt
      }

      return res.status(200).send("ok");
    } catch (err: any) {
      console.error("❌ Stripe verification failed:", err?.message);
      return res.status(400).send(`Webhook Error: ${err?.message}`);
    }
  };

  // Production webhook route
  app.post(
    "/api/stripe/webhook",
    bodyParser.raw({ type: "application/json" }),
    webhookHandler
  );

  // Temporary alias for 48h transition period
  app.post(
    "/api/stripe/webhook-harness",
    bodyParser.raw({ type: "application/json" }),
    webhookHandler
  );
}

async function handleStripeEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;
    case "invoice.paid":
      console.log("💰 Invoice paid:", event.data.object);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      console.log(`📝 Subscription ${event.type.split('.').pop()}:`, event.data.object);
      break;
    default:
      console.log(`⚪ Unhandled event type: ${event.type}`);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;
  
  if (!metadata || !metadata.email) {
    console.error("❌ No metadata in checkout session");
    return;
  }

  try {
    console.log("🚀 Creating user from checkout:", metadata.email);

    // Create user account
    const { storage } = await import('./storage');
    const user = await storage.upsertUser({
      id: metadata.userId,
      email: metadata.email,
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
    });
    
    console.log(`✅ User created: ${user.email}`);
    
    // Send welcome email with retries
    await sendWelcomeEmailWithRetries(metadata, session);
    
  } catch (error) {
    console.error('❌ Error processing checkout:', error);
    throw error; // Re-throw for webhook retry
  }
}

async function sendWelcomeEmailWithRetries(metadata: any, session: Stripe.Checkout.Session, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { authService } = await import('./services/auth-service');
      const { emailServiceWrapper } = await import('./services/email-service-wrapper');
      
      const { token } = await authService.createMagicLinkToken(
        metadata.email,
        metadata.userId,
        'stripe-webhook',
        'stripe-checkout'
      );
      
      const appUrl = process.env.APP_BASE_URL || process.env.APP_URL || 'https://bluetradie.com';
      const loginUrl = `${appUrl}/auth/verify?token=${token}`;
      
      const emailSent = await emailServiceWrapper.sendWelcomeWithMagicLink(
        metadata.email,
        metadata.firstName,
        metadata.plan,
        loginUrl
      );
      
      if (emailSent) {
        console.log(`📧 Welcome email sent to: ${metadata.email}`);
        return;
      } else {
        throw new Error('Email service returned false');
      }
      
    } catch (error: any) {
      console.error(`❌ Email attempt ${attempt}/${maxRetries} failed:`, error?.message);
      
      if (attempt === maxRetries) {
        console.error(`❌ Failed to send welcome email after ${maxRetries} attempts`);
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}