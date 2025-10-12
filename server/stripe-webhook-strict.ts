import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";
import { storage } from "./storage";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-07-30.basil",
});

const signingSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export const stripeWebhookStrict = express.Router();

// ---- ABSOLUTELY FIRST: route-scoped RAW parser ----
stripeWebhookStrict.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    // --- DEBUG: prove what we actually received ---
    const sig = req.headers["stripe-signature"];
    const isBuf = Buffer.isBuffer(req.body);
    console.log("[STRIPE DEBUG] content-type:", req.headers["content-type"]);
    console.log("[STRIPE DEBUG] has signature:", !!sig);
    console.log("[STRIPE DEBUG] body is Buffer:", isBuf, "typeof:", typeof req.body);

    // If some middleware parsed it, stop here and log loudly.
    if (!isBuf) {
      // Do NOT call constructEvent on objects/strings.
      console.error(
        "[STRIPE FATAL] req.body is NOT a Buffer. A JSON/urlencoded/cookie/compression middleware ran before this route."
      );
      return res
        .status(400)
        .send("Webhook requires raw body. Ensure this route is mounted before ANY body parsers.");
    }

    if (!signingSecret || !sig) {
      return res.status(400).send("Missing Stripe signature or webhook secret");
    }

    try {
      const event = stripe.webhooks.constructEvent(req.body, String(sig), signingSecret);
      console.log("✅ [STRIPE OK] event verified:", event.type);
      
      // Handle important events
      switch (event.type) {
        case "checkout.session.completed":
          await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case "customer.subscription.created":
          console.log("📝 Subscription created:", event.data.object);
          break;
        case "invoice.paid":
          console.log("💰 Invoice paid:", event.data.object);
          break;
        default:
          console.log(`⚪ Unhandled event type: ${event.type}`);
      }
      
      return res.status(200).send("ok");
    } catch (err: any) {
      console.error("❌ Stripe verification failed:", err?.message);
      return res.status(400).send(`Webhook Error: ${err?.message}`);
    }
  }
);

// Handle completed checkout sessions
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const metadata = session.metadata;
    if (!metadata) {
      console.error("❌ No metadata in checkout session");
      return;
    }

    console.log("🚀 Creating user from checkout:", metadata.email);

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

    console.log(`✅ User created: ${user.email}`);

    // Send welcome email with magic link
    try {
      const { authService } = await import('./services/auth-service');
      const { emailServiceWrapper } = await import('./services/email-service-wrapper');
      
      // Create magic link token for automatic login
      const { token } = await authService.createMagicLinkToken(
        session.customer_email || metadata.email,
        metadata.userId,
        'stripe-webhook',
        'stripe-checkout'
      );
      
      // Build secure login URL
      const appUrl = process.env.APP_BASE_URL || process.env.APP_URL || 'https://bluetradie.com';
      const loginUrl = `${appUrl}/auth/verify?token=${token}`;
      
      // Send welcome email with magic link
      const emailSent = await emailServiceWrapper.sendWelcomeWithMagicLink(
        session.customer_email || metadata.email,
        metadata.firstName,
        metadata.plan,
        loginUrl
      );
      
      if (emailSent) {
        console.log(`📧 Welcome email sent to: ${metadata.email}`);
      } else {
        console.error(`❌ Failed to send welcome email to: ${metadata.email}`);
      }
      
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
    }

  } catch (error) {
    console.error('❌ Error handling checkout completion:', error);
  }
}