import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";
import { db } from "./db";
import { webhookEvents, users } from "@shared/schema";
import { eq, and } from "drizzle-orm";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const STRIPE_VERIFY_DISABLED =
  (process.env.STRIPE_VERIFY_DISABLED || "").toLowerCase() === "true";

const stripe = new Stripe(STRIPE_SECRET_KEY || "sk_dummy", { apiVersion: "2024-06-20" });

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

      // Database-backed idempotency check
      const existingEvent = await db
        .select()
        .from(webhookEvents)
        .where(
          and(
            eq(webhookEvents.provider, "stripe"),
            eq(webhookEvents.providerEventId, event.id)
          )
        )
        .limit(1);

      if (existingEvent.length > 0) {
        const existing = existingEvent[0];
        console.log(`[STRIPE SKIP] Event ${event.id} already ${existing.status}`);

        // Return cached response if available and completed
        if (existing.status === "processed" && existing.responseData) {
          return res.status(200).json(existing.responseData);
        }

        // If still processing or failed, acknowledge receipt
        return res.status(200).send("ok: event already recorded");
      }

      console.log("[STRIPE OK]", { type: event.type, id: event.id });

      // Record webhook event
      const [webhookRecord] = await db
        .insert(webhookEvents)
        .values({
          provider: "stripe",
          providerEventId: event.id,
          eventType: event.type,
          eventData: event as any,
          status: "pending",
        })
        .returning();

      // Handle events
      try {
        await handleStripeEvent(event);

        // Mark as processed
        await db
          .update(webhookEvents)
          .set({
            status: "processed",
            processedAt: new Date(),
          })
          .where(eq(webhookEvents.id, webhookRecord.id));

        console.log(`[STRIPE SUCCESS] Event ${event.id} processed`);
      } catch (error: any) {
        console.error(`[STRIPE ERROR] Processing event ${event.id}:`, error);

        // Mark as failed but still return 200 to acknowledge receipt
        await db
          .update(webhookEvents)
          .set({
            status: "failed",
            errorMessage: error?.message || String(error),
            retryCount: webhookRecord.retryCount + 1,
          })
          .where(eq(webhookEvents.id, webhookRecord.id));
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

    case "payment_intent.succeeded":
      await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;

    case "payment_intent.payment_failed":
      await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    case "invoice.paid":
      console.log("💰 Invoice paid:", event.data.object);
      break;

    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
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

    // Create user account (upsert handles duplicates)
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
    
    // Check if welcome email already sent (prevent duplicates)
    if (!user.welcomeSentAt) {
      await sendWelcomeEmailWithRetries(metadata, session);
      
      // Mark welcome email as sent
      await storage.updateUser(user.id, { 
        welcomeSentAt: new Date() 
      });
      console.log(`📧 Welcome email sent to: ${metadata.email}`);
    } else {
      console.log(`📧 Welcome email already sent to: ${metadata.email}, skipping`);
    }
    
  } catch (error) {
    console.error('❌ Error processing checkout:', error);
    throw error; // Re-throw for webhook retry
  }
}

async function sendWelcomeEmailWithRetries(metadata: any, session: Stripe.Checkout.Session, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { emailServiceWrapper } = await import('./services/email-service-wrapper');
      
      // Send welcome email only (no magic link - user will request login separately)
      const emailSent = await emailServiceWrapper.sendWelcomeEmail(
        metadata.email,
        metadata.firstName,
        metadata.plan || 'pro'
      );
      
      if (emailSent) {
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

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("💰 Payment succeeded:", {
    id: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    metadata: paymentIntent.metadata,
  });

  // Update invoice status if this payment is for an invoice
  if (paymentIntent.metadata?.invoiceId) {
    try {
      const { invoices } = await import('@shared/schema');

      await db
        .update(invoices)
        .set({
          status: "paid",
          paidAt: new Date(),
          stripePaymentIntentId: paymentIntent.id,
        })
        .where(eq(invoices.id, parseInt(paymentIntent.metadata.invoiceId)));

      console.log(`✅ Invoice ${paymentIntent.metadata.invoiceId} marked as paid`);
    } catch (error) {
      console.error("❌ Error updating invoice:", error);
      throw error;
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.error("❌ Payment failed:", {
    id: paymentIntent.id,
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    lastError: paymentIntent.last_payment_error,
    metadata: paymentIntent.metadata,
  });

  // Update invoice status if this payment is for an invoice
  if (paymentIntent.metadata?.invoiceId) {
    try {
      const { invoices } = await import('@shared/schema');

      await db
        .update(invoices)
        .set({
          status: "overdue",
          paymentFailedReason: paymentIntent.last_payment_error?.message || "Payment failed",
        })
        .where(eq(invoices.id, parseInt(paymentIntent.metadata.invoiceId)));

      console.log(`⚠️ Invoice ${paymentIntent.metadata.invoiceId} marked as overdue (payment failed)`);

      // TODO: Send payment failed notification email to customer
    } catch (error) {
      console.error("❌ Error updating invoice:", error);
      throw error;
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("❌ Invoice payment failed:", {
    id: invoice.id,
    customer: invoice.customer,
    amount: invoice.amount_due,
    attempt_count: invoice.attempt_count,
    next_payment_attempt: invoice.next_payment_attempt
  });

  // Find user by Stripe customer ID
  const customer = await db.query.users.findFirst({
    where: eq(users.stripeCustomerId, invoice.customer as string)
  });

  if (!customer) {
    console.log("⚠️ No user found for customer:", invoice.customer);
    return;
  }

  // Update subscription status to past_due or unpaid
  await db.update(users)
    .set({
      subscriptionStatus: invoice.attempt_count >= 4 ? "unpaid" : "past_due",
      updatedAt: new Date()
    })
    .where(eq(users.id, customer.id));

  console.log(`✅ Updated user ${customer.id} subscription status to ${
    invoice.attempt_count >= 4 ? "unpaid" : "past_due"
  }`);

  // TODO: Send email notification to user about failed payment
  // TODO: If attempt_count >= 4, consider suspending access
}