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
        // Minimal handling only; business logic not required for this proof
        return res.status(200).send("ok");
      } catch (err: any) {
        console.error("❌ Stripe verification failed:", err?.message);
        return res.status(400).send(`Webhook Error: ${err?.message}`);
      }
    }
  );
}