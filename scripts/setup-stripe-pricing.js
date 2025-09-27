#!/usr/bin/env node

/**
 * Stripe Pricing Setup Script
 * 
 * This script automatically creates Blue Tradie's pricing plans in Stripe
 * and outputs the Price IDs needed for environment variables.
 * 
 * Usage: node scripts/setup-stripe-pricing.js
 */

import Stripe from 'stripe';
import fs from 'fs';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.error('❌ Error: STRIPE_SECRET_KEY not found in environment variables');
  console.log('💡 Make sure you have a .env file with STRIPE_SECRET_KEY=your_key');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-07-30.basil',
});

async function setupStripePricing() {
  console.log('🔧 Setting up Blue Tradie pricing in Stripe...\n');

  try {
    // Check if we're using test or live keys
    const keyType = STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST' : 'LIVE';
    console.log(`🔑 Using ${keyType} Stripe environment`);

    // Create Pro Plan Product & Price
    console.log('📦 Creating Pro Plan product...');
    const proProduct = await stripe.products.create({
      name: 'Blue Tradie Pro',
      description: 'Professional plan for individual tradies with AI advisors, invoicing, and automation',
      metadata: {
        plan: 'pro',
        features: 'AI Advisors, Smart Invoicing, Tradie Network, Automation',
        target: 'Individual tradies and small businesses'
      }
    });

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 5900, // $59.00 AUD
      currency: 'aud',
      recurring: {
        interval: 'month',
      },
      nickname: 'Blue Tradie Pro Monthly',
      metadata: {
        plan: 'pro',
        display_amount: '$59',
        trial_eligible: 'true'
      }
    });

    console.log(`✅ Pro Plan created: ${proProduct.name}`);
    console.log(`   Product ID: ${proProduct.id}`);
    console.log(`   Price ID: ${proPrice.id}\n`);

    // Create Teams Plan Product & Price
    console.log('📦 Creating Teams Plan product...');
    const teamsProduct = await stripe.products.create({
      name: 'Blue Tradie Teams',
      description: 'Advanced plan for tradie teams with enhanced collaboration and management features',
      metadata: {
        plan: 'teams',
        features: 'Everything in Pro + Team Management, Advanced Analytics, Priority Support',
        target: 'Tradie teams and growing businesses'
      }
    });

    const teamsPrice = await stripe.prices.create({
      product: teamsProduct.id,
      unit_amount: 14900, // $149.00 AUD
      currency: 'aud',
      recurring: {
        interval: 'month',
      },
      nickname: 'Blue Tradie Teams Monthly',
      metadata: {
        plan: 'teams',
        display_amount: '$149',
        trial_eligible: 'true'
      }
    });

    console.log(`✅ Teams Plan created: ${teamsProduct.name}`);
    console.log(`   Product ID: ${teamsProduct.id}`);
    console.log(`   Price ID: ${teamsPrice.id}\n`);

    // Output Environment Variables
    console.log('🎉 SUCCESS! Stripe pricing setup complete!\n');
    console.log('📝 Add these environment variables to your Render deployment:\n');
    console.log('=' .repeat(60));
    console.log(`STRIPE_PRICE_PRO_MONTH=${proPrice.id}`);
    console.log(`STRIPE_PRICE_TEAMS_MONTH=${teamsPrice.id}`);
    console.log('=' .repeat(60));
    console.log('\n💡 Instructions:');
    console.log('1. Copy the Price IDs above');
    console.log('2. Go to your Render dashboard → Environment variables');
    console.log('3. Add STRIPE_PRICE_PRO_MONTH and STRIPE_PRICE_TEAMS_MONTH');
    console.log('4. Redeploy your service');
    console.log('\n🎯 Your Stripe trial system is now ready for production!');

    // Save to file for reference
    const config = {
      created: new Date().toISOString(),
      environment: keyType,
      products: {
        pro: {
          product_id: proProduct.id,
          price_id: proPrice.id,
          amount: '$59 AUD/month',
          description: proProduct.description
        },
        teams: {
          product_id: teamsProduct.id,
          price_id: teamsPrice.id,
          amount: '$149 AUD/month',
          description: teamsProduct.description
        }
      },
      environment_variables: {
        STRIPE_PRICE_PRO_MONTH: proPrice.id,
        STRIPE_PRICE_TEAMS_MONTH: teamsPrice.id
      }
    };

    // Write config file
    fs.writeFileSync('./stripe-config.json', JSON.stringify(config, null, 2));
    console.log('\n💾 Configuration saved to stripe-config.json');

  } catch (error) {
    console.error('❌ Error setting up Stripe pricing:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('🔑 Check that your STRIPE_SECRET_KEY is valid and has the right permissions');
    } else if (error.type === 'StripeAPIError') {
      console.log('🌐 There was an issue with the Stripe API. Please try again.');
    }
    
    process.exit(1);
  }
}

// Run the setup
setupStripePricing();