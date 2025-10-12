import { Router } from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";
import { storage } from "./storage";

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const signingSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

if (!stripeSecret) console.warn("[STRIPE] STRIPE_SECRET_KEY missing");
if (!signingSecret) console.warn("[STRIPE] STRIPE_WEBHOOK_SECRET missing");

const stripe = new Stripe(stripeSecret, { apiVersion: "2025-07-30.basil" });

export const stripeWebhookRouter = Router();

// Debug endpoint to manually create user (remove after testing)
stripeWebhookRouter.post("/debug/create-user", async (req, res) => {
  try {
    const { email, firstName = "Test", lastName = "User" } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }
    
    const user = await storage.upsertUser({
      id: `manual-${Date.now()}`,
      email,
      firstName,
      lastName,
      country: "Australia", 
      trade: "Test Trade",
      isOnboarded: true,
      isFreeTrialUser: true,
      freeTrialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    
    res.json({ success: true, user: { id: user.id, email: user.email } });
  } catch (error) {
    console.error("Manual user creation error:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

// Stripe webhook endpoint with proper raw body parsing
stripeWebhookRouter.post(
  "/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    if (!sig || !signingSecret) {
      console.error("❌ Missing signature or secret");
      return res.status(400).send("Missing signature or secret");
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,            // raw Buffer
        String(sig),
        signingSecret
      );

      console.log(`✅ Stripe webhook verified: ${event.type}`);

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