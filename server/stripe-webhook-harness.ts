import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const STRIPE_VERIFY_DISABLED =
  (process.env.STRIPE_VERIFY_DISABLED || "").toLowerCase() === "true";

const stripe = new Stripe(STRIPE_SECRET_KEY || "sk_dummy", { apiVersion: "2024-06-20" });

export function mountStripeHarness(app: express.Express) {
  // Health: proves correct process + env
  app.get("/healthz", (_req, res) => {
    res.setHeader("x-svc", "api");
    res.status(200).json({
      ok: true,
      service: "api",
      verifyDisabled: STRIPE_VERIFY_DISABLED,
      hasWebhookSecret: Boolean(STRIPE_WEBHOOK_SECRET),
    });
  });

  // Ping: proves /api path hits same process + env
  app.get("/api/stripe/webhook/ping", (req, res) => {
    res.setHeader("x-stripe-verify-disabled", String(STRIPE_VERIFY_DISABLED));
    res.status(200).json({
      ok: true,
      path: req.originalUrl,
      verifyDisabled: STRIPE_VERIFY_DISABLED,
      hasWebhookSecret: Boolean(STRIPE_WEBHOOK_SECRET),
    });
  });

  // THE webhook: raw body, loud logs, bypass flag
  app.post(
    "/api/stripe/webhook-harness",
    bodyParser.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      res.setHeader("x-stripe-verify-disabled", String(STRIPE_VERIFY_DISABLED));
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
        console.log("[STRIPE BYPASS] returning 200");
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
        console.log("[STRIPE OK]", { type: event.type });
        
        // Handle checkout completion with user creation and email
        if (event.type === 'checkout.session.completed') {
          const session = event.data.object as any;
          const metadata = session.metadata;
          
          if (metadata && metadata.email) {
            try {
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
              
              // Send welcome email with magic link
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
              } else {
                console.error(`❌ Failed to send welcome email to: ${metadata.email}`);
              }
              
            } catch (error) {
              console.error('❌ Error processing checkout:', error);
            }
          }
        }
        
        return res.status(200).send("ok");
      } catch (err: any) {
        console.error("❌ Stripe verification failed:", err?.message);
        return res.status(400).send(`Webhook Error: ${err?.message}`);
      }
    }
  );
}