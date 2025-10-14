import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const STRIPE_VERIFY_DISABLED =
  (process.env.STRIPE_VERIFY_DISABLED || "").toLowerCase() === "true";

// Use a stable, supported API version.
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

export const stripeWebhookRaw = express.Router();

/**
 * IMPORTANT
 * - Path MUST be /api/stripe/webhook (combined with app.use('/api', ...)).
 * - raw() ensures req.body is a Buffer on this route only.
 */
stripeWebhookRaw.post(
  "/stripe/webhook",
  bodyParser.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"];
    const isBuf = Buffer.isBuffer(req.body);

    // Diagnostics to prove routing/body are correct
    console.log("[STRIPE DEBUG]", {
      path: req.originalUrl,
      hasSig: !!sig,
      contentType: req.headers["content-type"],
      isBuffer: isBuf,
      len: isBuf ? (req.body as Buffer).length : -1,
      verifyDisabled: STRIPE_VERIFY_DISABLED,
    });

    // Bypass mode to isolate routing/body parsing issues quickly
    if (STRIPE_VERIFY_DISABLED) {
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
        req.body as Buffer,              // RAW BYTES ONLY
        String(sig),
        STRIPE_WEBHOOK_SECRET
      );

      console.log("[STRIPE OK] event:", event.type);

      // Minimal handling (no-ops by default)
      switch (event.type) {
        case "checkout.session.completed":
        case "invoice.paid":
        case "customer.subscription.created":
        default:
          break;
      }

      return res.status(200).send("ok");
    } catch (err: any) {
      console.error("❌ Stripe verification failed:", err?.message);
      return res.status(400).send(`Webhook Error: ${err?.message}`);
    }
  }
);

// Simple ping test route to verify API is reachable  
stripeWebhookRaw.get("/webhook/ping", (req: Request, res: Response) => {
  res.json({ 
    ok: true, 
    verifyDisabled: STRIPE_VERIFY_DISABLED || false,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});