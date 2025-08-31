import type { Express, Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "../storage";
import sendgridService from "../sendgrid-service.js";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export function registerInvoiceRoutes(app: Express) {
  
  // Create Stripe Checkout Session for invoice payment
  app.post('/api/invoices/:id/paylink', async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      // Check if session already exists
      if (invoice.stripeSessionId) {
        try {
          const existingSession = await stripe.checkout.sessions.retrieve(invoice.stripeSessionId);
          if (existingSession.status === 'open') {
            return res.json({ url: existingSession.url });
          }
        } catch (error) {
          console.log('Existing session not found or expired, creating new one');
        }
      }

      // Create new Stripe Checkout Session
      let baseUrl = process.env.APP_BASE_URL || 'https://localhost:5000';
      // Ensure URL has proper scheme
      if (baseUrl && !baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }
      
      console.log('🔗 Using baseUrl for Stripe checkout:', baseUrl);
        
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'aud',
              product_data: {
                name: `Invoice ${invoice.invoiceNumber}`,
                description: `Payment for services from ${invoice.customerName}`,
              },
              unit_amount: Math.round(parseFloat(invoice.total.toString()) * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        customer_email: invoice.customerEmail || undefined,
        metadata: {
          invoiceId: invoice.id.toString(),
          userId: invoice.userId,
          invoiceNumber: invoice.invoiceNumber,
        },
        success_url: `${baseUrl}/invoice/success?inv=${invoice.id}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/invoice/cancel?inv=${invoice.id}`,
        expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
      });

      // Save the session ID to the invoice
      await storage.updateInvoice(invoice.id, {
        stripeSessionId: session.id,
        paymentStatus: 'pending'
      });

      res.json({ url: session.url });

    } catch (error: any) {
      console.error('Error creating Stripe checkout session:', error);
      res.status(500).json({ 
        error: 'Failed to create payment link',
        details: error.message 
      });
    }
  });

  // Send invoice email with payment link
  app.post('/api/invoices/:id/email', async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { emailTo, customMessage } = req.body;
      
      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      const user = await storage.getUser(invoice.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create payment link first
      const paylinkResponse = await fetch(`${req.protocol}://${req.get('host')}/api/invoices/${invoiceId}/paylink`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!paylinkResponse.ok) {
        throw new Error('Failed to create payment link');
      }

      const { url: paymentUrl } = await paylinkResponse.json();

      // Generate invoice PDF data (simplified for demo)
      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        customerName: invoice.customerName,
        businessName: user.businessName || 'Blue Tradie Business',
        subtotal: invoice.subtotal,
        gst: invoice.gst,
        total: invoice.total,
        lineItems: invoice.lineItems,
        dueDate: invoice.dueDate,
        createdAt: invoice.createdAt
      };

      // Send email via SendGrid
      const emailResult = await sendgridService.sendInvoiceEmail({
        to: emailTo,
        invoiceData,
        paymentUrl,
        customMessage: customMessage || '',
        businessName: user.businessName || 'Blue Tradie Business'
      });

      if (!emailResult.success) {
        throw new Error(emailResult.error || 'Failed to send email');
      }

      // Update invoice with email details
      await storage.updateInvoice(invoice.id, {
        emailTo,
        emailSentAt: new Date(),
        paymentStatus: invoice.paymentStatus === 'draft' ? 'sent' : invoice.paymentStatus
      });

      res.json({ 
        success: true, 
        message: 'Invoice email sent successfully',
        paymentUrl 
      });

    } catch (error: any) {
      console.error('Error sending invoice email:', error);
      res.status(500).json({ 
        error: 'Failed to send invoice email',
        details: error.message 
      });
    }
  });

  // Get invoice payment status
  app.get('/api/invoices/:id/payment-status', async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoiceById(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ error: 'Invoice not found' });
      }

      res.json({
        paymentStatus: invoice.paymentStatus,
        paidAt: invoice.paidAt,
        stripePaymentIntentId: invoice.stripePaymentIntentId,
        stripeSessionId: invoice.stripeSessionId
      });

    } catch (error: any) {
      console.error('Error getting payment status:', error);
      res.status(500).json({ 
        error: 'Failed to get payment status',
        details: error.message 
      });
    }
  });
}