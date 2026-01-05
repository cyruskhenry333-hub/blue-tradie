import type { Express, Request, Response } from "express";
import type Stripe from "stripe";
import StripeClient from "stripe";
import { storage } from "../storage";
import express from "express";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new StripeClient(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export function registerStripeWebhookRoutes(app: Express) {
  // Stripe webhook endpoint with raw body parsing
  app.post('/api/stripe/webhook', 
    // Use express.raw() to get the raw body for signature verification
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET environment variable is not set');
        return res.status(400).send('Webhook secret not configured');
      }

      let event: Stripe.Event;
      
      try {
        event = stripe.webhooks.constructEvent(req.body as any, sig, webhookSecret);
        console.log('✅ Stripe webhook signature verified successfully');
      } catch (err) {
        console.error('❌ Stripe webhook signature verification failed:', err);
        return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
      }

      // Log the full payload for debugging
      console.log('📧 Stripe webhook received:', {
        type: event.type,
        id: event.id,
        created: new Date(event.created * 1000).toISOString(),
        payload: JSON.stringify(event.data, null, 2)
      });

      try {
        // Handle specific events with idempotency check
        const eventProcessed = await checkEventIdempotency(event.id);
        if (eventProcessed) {
          console.log(`🔄 Event ${event.id} already processed, skipping`);
          res.status(200).json({ received: true, eventType: event.type, skipped: true });
          return;
        }

        // when branching:
        if (event.type === "checkout.session.completed") {
          const session = event.data.object as Stripe.Checkout.Session;
          await handleCheckoutSessionCompleted(event, session);
        } else if (event.type === "invoice.paid") {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaid(event, invoice);
        } else if (event.type === "invoice.payment_failed") {
          const invoice = event.data.object as Stripe.Invoice;
          await handleInvoicePaymentFailed(event, invoice);
        } else if (event.type === "payment_intent.succeeded") {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentIntentSucceeded(event, paymentIntent);
        } else if (event.type === "payment_intent.payment_failed") {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          await handlePaymentIntentFailed(event, paymentIntent);
        } else {
          console.log(`🔄 Unhandled event type: ${event.type}`);
        }

        // Mark event as processed
        await markEventAsProcessed(event.id);

        // Return 200 as soon as event is verified and logged
        res.status(200).json({ received: true, eventType: event.type });

      } catch (error) {
        console.error('❌ Error processing webhook event:', error);
        // Still return 200 to acknowledge receipt, but log the processing error
        res.status(200).json({ 
          received: true, 
          eventType: event.type, 
          processingError: true 
        });
      }
    }
  );
}

async function handleCheckoutSessionCompleted(event: Stripe.Event, session: Stripe.Checkout.Session) {
  
  console.log('💳 Processing checkout.session.completed:', {
    sessionId: session.id,
    customerEmail: session.customer_email,
    amountTotal: session.amount_total,
    currency: session.currency,
    paymentStatus: session.payment_status,
    customerId: session.customer,
    metadata: session.metadata
  });

  // Handle invoice payment completion
  if (session.metadata?.invoiceId) {
    const invoiceId = parseInt(session.metadata.invoiceId);
    const paymentIntentId = session.payment_intent as string;
    
    try {
      await storage.updateInvoicePaymentStatus(
        invoiceId,
        'paid',
        paymentIntentId,
        new Date()
      );
      
      console.log(`✅ Invoice ${invoiceId} marked as paid via checkout session ${session.id}`);
    } catch (error) {
      console.error(`❌ Failed to update invoice ${invoiceId} payment status:`, error);
    }
  }
}

async function handleInvoicePaid(event: Stripe.Event, invoice: Stripe.Invoice) {
  
  console.log('✅ Processing invoice.paid:', {
    invoiceId: invoice.id,
    customerEmail: invoice.customer_email,
    amountPaid: invoice.amount_paid,
    currency: invoice.currency,
    subscriptionId: (invoice as any).subscription || '',
    customerId: invoice.customer,
    invoiceNumber: invoice.number,
    paidAt: new Date(invoice.status_transitions?.paid_at || 0 * 1000).toISOString()
  });

  // Handle invoice payment (for subscription invoices)
  if (invoice.metadata?.invoiceId) {
    const invoiceId = parseInt(invoice.metadata.invoiceId);
    
    try {
      await storage.updateInvoicePaymentStatus(
        invoiceId,
        'paid',
        (invoice as any).payment_intent || null,
        new Date(invoice.status_transitions?.paid_at || 0 * 1000)
      );
      
      console.log(`✅ Invoice ${invoiceId} marked as paid via Stripe invoice ${invoice.id}`);
    } catch (error) {
      console.error(`❌ Failed to update invoice ${invoiceId} payment status:`, error);
    }
  }
}

async function handleInvoicePaymentFailed(event: Stripe.Event, invoice: Stripe.Invoice) {
  
  console.log('❌ Processing invoice.payment_failed:', {
    invoiceId: invoice.id,
    customerEmail: invoice.customer_email,
    amountDue: invoice.amount_due,
    currency: invoice.currency,
    subscriptionId: (invoice as any).subscription || '',
    customerId: invoice.customer,
    invoiceNumber: invoice.number,
    attemptCount: invoice.attempt_count,
    nextPaymentAttempt: invoice.next_payment_attempt ? 
      new Date(invoice.next_payment_attempt * 1000).toISOString() : null
  });

  // Handle invoice payment failure
  if (invoice.metadata?.invoiceId) {
    const invoiceId = parseInt(invoice.metadata.invoiceId);
    
    try {
      await storage.updateInvoicePaymentStatus(invoiceId, 'failed');
      
      console.log(`❌ Invoice ${invoiceId} marked as payment failed via Stripe invoice ${invoice.id}`);
    } catch (error) {
      console.error(`❌ Failed to update invoice ${invoiceId} payment status:`, error);
    }
  }
}

async function handlePaymentIntentSucceeded(event: Stripe.Event, paymentIntent: Stripe.PaymentIntent) {

  console.log('✅ Processing payment_intent.succeeded:', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
    metadata: paymentIntent.metadata
  });

  // Handle payment success for checkout sessions
  if (paymentIntent.metadata?.invoiceId) {
    const invoiceId = parseInt(paymentIntent.metadata.invoiceId);

    try {
      await storage.updateInvoicePaymentStatus(
        invoiceId,
        'paid',
        paymentIntent.id,
        new Date()
      );

      console.log(`✅ Invoice ${invoiceId} marked as paid via payment intent ${paymentIntent.id}`);
    } catch (error) {
      console.error(`❌ Failed to update invoice ${invoiceId} payment status:`, error);
    }
  }
}

async function handlePaymentIntentFailed(event: Stripe.Event, paymentIntent: Stripe.PaymentIntent) {

  console.log('❌ Processing payment_intent.payment_failed:', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    lastPaymentError: paymentIntent.last_payment_error,
    metadata: paymentIntent.metadata
  });

  // Handle payment failure for checkout sessions
  if (paymentIntent.metadata?.invoiceId) {
    const invoiceId = parseInt(paymentIntent.metadata.invoiceId);

    try {
      await storage.updateInvoicePaymentStatus(invoiceId, 'failed');

      console.log(`❌ Invoice ${invoiceId} marked as payment failed via payment intent ${paymentIntent.id}`);
    } catch (error) {
      console.error(`❌ Failed to update invoice ${invoiceId} payment status:`, error);
    }
  }
}

// Simple in-memory store for processed events (in production, use database)
const processedEvents = new Set<string>();

async function checkEventIdempotency(eventId: string): Promise<boolean> {
  return processedEvents.has(eventId);
}

async function markEventAsProcessed(eventId: string): Promise<void> {
  processedEvents.add(eventId);
  // In production, also store in database with expiration
}