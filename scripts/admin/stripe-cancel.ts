#!/usr/bin/env node

import { Command } from 'commander';
import Stripe from 'stripe';

const program = new Command();

interface CancelOptions {
  email?: string;
  allLive?: boolean;
  allTest?: boolean;
  mode: 'immediate' | 'period_end';
  refund?: string;
  dryRun?: boolean;
  confirm?: string;
}

let stripe: Stripe;

async function initializeStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('❌ STRIPE_SECRET_KEY environment variable required');
    process.exit(1);
  }

  const isLive = secretKey.startsWith('sk_live_');
  const isTest = secretKey.startsWith('sk_test_');
  
  if (!isLive && !isTest) {
    console.error('❌ Invalid Stripe secret key format');
    process.exit(1);
  }

  stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });
  
  console.log(`🔑 Stripe initialized: ${isLive ? 'LIVE' : 'TEST'} mode`);
  
  if (isLive) {
    console.log('⚠️  WARNING: Using LIVE Stripe keys - real money involved!');
  }
  
  return { isLive, isTest };
}

async function stripeCancel(options: CancelOptions) {
  console.log('💳 Blue Tradie Stripe Cancellation Tool');
  console.log('=======================================');
  
  const { isLive } = await initializeStripe();
  
  // Safety checks
  if (options.allLive && !isLive) {
    console.error('❌ Cannot use --all-live with test keys');
    process.exit(1);
  }
  
  if (options.allTest && isLive) {
    console.error('❌ Cannot use --all-test with live keys');
    process.exit(1);
  }
  
  if ((options.allLive || options.allTest) && options.confirm !== 'CANCEL ALL') {
    console.error('❌ Bulk operations require --confirm "CANCEL ALL"');
    process.exit(1);
  }

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  try {
    if (options.email) {
      await cancelForEmail(options.email, options);
    } else if (options.allLive || options.allTest) {
      await cancelAllCustomers(options);
    } else {
      console.error('❌ Specify --email <email>, --all-live, or --all-test');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Cancellation failed:', error);
    process.exit(1);
  }
}

async function cancelForEmail(email: string, options: CancelOptions) {
  console.log(`🔍 Looking up Stripe customer: ${email}`);
  
  try {
    // Find customer by email
    const customers = await stripe.customers.list({
      email: email,
      limit: 10
    });
    
    if (customers.data.length === 0) {
      console.log(`ℹ️  No Stripe customer found for: ${email}`);
      return;
    }
    
    if (customers.data.length > 1) {
      console.log(`⚠️  Multiple customers found for ${email}:`);
      customers.data.forEach((customer, i) => {
        console.log(`   ${i + 1}. ${customer.id} - ${customer.description || 'No description'}`);
      });
    }
    
    for (const customer of customers.data) {
      await processCustomer(customer, options);
    }
    
  } catch (error) {
    console.error(`❌ Error processing email ${email}:`, error);
    throw error;
  }
}

async function processCustomer(customer: Stripe.Customer, options: CancelOptions) {
  console.log(`\n📋 Customer: ${customer.id}`);
  console.log(`   Email: ${customer.email}`);
  console.log(`   Name: ${customer.name || 'N/A'}`);
  console.log(`   Created: ${new Date(customer.created * 1000).toISOString()}`);
  
  // Get subscriptions
  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: 'active'
  });
  
  console.log(`   Active subscriptions: ${subscriptions.data.length}`);
  
  if (subscriptions.data.length === 0) {
    console.log(`   ℹ️  No active subscriptions to cancel`);
    return;
  }
  
  // Process each subscription
  for (const subscription of subscriptions.data) {
    await processSubscription(subscription, options);
  }
  
  // Handle refunds if requested
  if (options.refund === 'all') {
    await processRefunds(customer, options);
  }
}

async function processSubscription(subscription: Stripe.Subscription, options: CancelOptions) {
  console.log(`\n   💼 Subscription: ${subscription.id}`);
  console.log(`      Status: ${subscription.status}`);
  console.log(`      Current period: ${new Date(subscription.current_period_start * 1000).toISOString()} - ${new Date(subscription.current_period_end * 1000).toISOString()}`);
  
  if (subscription.items.data.length > 0) {
    const item = subscription.items.data[0];
    if (item.price) {
      console.log(`      Amount: ${item.price.unit_amount ? (item.price.unit_amount / 100) : 'N/A'} ${item.price.currency?.toUpperCase()}`);
    }
  }
  
  if (options.dryRun) {
    console.log(`      🔍 DRY RUN - Would cancel ${options.mode === 'immediate' ? 'immediately' : 'at period end'}`);
    return;
  }
  
  try {
    if (options.mode === 'immediate') {
      await stripe.subscriptions.cancel(subscription.id);
      console.log(`      ✅ Cancelled immediately`);
    } else {
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true
      });
      console.log(`      ✅ Scheduled to cancel at period end`);
    }
  } catch (error) {
    console.error(`      ❌ Failed to cancel subscription:`, error);
  }
}

async function processRefunds(customer: Stripe.Customer, options: CancelOptions) {
  console.log(`\n   💰 Processing refunds for ${customer.id}...`);
  
  // Get recent payment intents
  const paymentIntents = await stripe.paymentIntents.list({
    customer: customer.id,
    limit: 10
  });
  
  for (const pi of paymentIntents.data) {
    if (pi.status === 'succeeded' && pi.amount_received > 0) {
      console.log(`      💳 Payment Intent: ${pi.id}`);
      console.log(`         Amount: ${pi.amount_received / 100} ${pi.currency.toUpperCase()}`);
      console.log(`         Created: ${new Date(pi.created * 1000).toISOString()}`);
      
      if (options.dryRun) {
        console.log(`         🔍 DRY RUN - Would refund ${pi.amount_received / 100} ${pi.currency.toUpperCase()}`);
        continue;
      }
      
      try {
        const refund = await stripe.refunds.create({
          payment_intent: pi.id,
          reason: 'requested_by_customer'
        });
        console.log(`         ✅ Refund created: ${refund.id}`);
      } catch (error) {
        console.error(`         ❌ Refund failed:`, error);
      }
    }
  }
}

async function cancelAllCustomers(options: CancelOptions) {
  console.log('🔍 Scanning all customers...');
  
  // This is extremely dangerous - implement with maximum safety
  console.log('⚠️  BULK CANCELLATION NOT FULLY IMPLEMENTED FOR SAFETY');
  console.log('   Use individual --email cancellation instead');
  
  if (!options.dryRun) {
    console.log('❌ Bulk cancellation requires --dry-run for now');
    process.exit(1);
  }
  
  // In dry run, show what we would do
  const customers = await stripe.customers.list({ limit: 10 });
  console.log(`📊 Found ${customers.data.length} customers (showing first 10)`);
  
  for (const customer of customers.data) {
    console.log(`   ${customer.id} - ${customer.email} - ${customer.name || 'N/A'}`);
  }
}

// CLI setup
program
  .name('stripe-cancel')
  .description('Blue Tradie Stripe cancellation tool')
  .option('-e, --email <email>', 'Email of customer to cancel')
  .option('--all-live', 'Cancel all customers in live mode (dangerous!)')
  .option('--all-test', 'Cancel all customers in test mode')
  .option('-m, --mode <mode>', 'Cancellation mode: immediate or period_end', 'period_end')
  .option('-r, --refund <type>', 'Refund mode: all or specific payment intent ID')
  .option('-d, --dry-run', 'Show what would be done without making changes')
  .option('-c, --confirm <message>', 'Confirmation message for dangerous operations')
  .action(stripeCancel);

program.parse();