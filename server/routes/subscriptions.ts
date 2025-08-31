import type { Express } from "express";
import Stripe from "stripe";
import { storage } from "../storage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30.basil",
});

export function registerSubscriptionRoutes(app: Express) {
  // Feature flag check
  const isSubscriptionsEnabled = () => {
    return process.env.FEATURE_SUBSCRIPTIONS === 'true';
  };

  // Create subscription checkout session
  app.post('/api/create-subscription', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!isSubscriptionsEnabled()) {
      return res.status(503).json({ 
        error: 'Subscriptions are not currently available',
        message: 'This feature is coming soon! Stay tuned for updates.'
      });
    }

    let user = req.user;

    try {
      // Check if user already has an active subscription
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          return res.json({
            subscriptionId: subscription.id,
            status: subscription.status,
            message: 'You already have an active subscription'
          });
        }
      }

      if (!user.email) {
        throw new Error('No user email on file');
      }

      // Create or retrieve Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user.id,
            trade: user.trade || 'unknown',
            country: user.country || 'Australia'
          }
        });
        customerId = customer.id;
        await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customerId });
      }

      // Create subscription checkout session
      let baseUrl = process.env.APP_BASE_URL || 'https://localhost:5000';
      // Ensure URL has proper scheme
      if (baseUrl && !baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
      }
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: process.env.STRIPE_PRICE_ID || 'price_1234567890', // Replace with actual price ID
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/subscription/cancel`,
        metadata: {
          userId: user.id,
          userEmail: user.email,
          subscriptionType: 'blue_core'
        },
        billing_address_collection: 'required',
        tax_id_collection: {
          enabled: true,
        },
      });

      res.json({
        subscriptionCheckoutUrl: session.url,
        sessionId: session.id
      });

    } catch (error: any) {
      console.error('Subscription creation error:', error);
      return res.status(400).json({ 
        error: 'Failed to create subscription',
        details: error.message 
      });
    }
  });

  // Get subscription status
  app.get('/api/subscription/status', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = req.user;

    try {
      if (!user.stripeSubscriptionId) {
        return res.json({
          hasSubscription: false,
          status: 'none',
          message: 'No active subscription'
        });
      }

      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      res.json({
        hasSubscription: true,
        subscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        tier: user.subscriptionTier || 'Blue Core'
      });

    } catch (error: any) {
      console.error('Subscription status error:', error);
      res.status(500).json({ 
        error: 'Failed to get subscription status',
        details: error.message 
      });
    }
  });
}