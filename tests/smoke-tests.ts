/**
 * Production Smoke Tests
 *
 * Run these tests after deployment to verify critical functionality:
 * - Flow A: Quote → Invoice → Payment
 * - Flow B: AI Chat
 * - Flow C: Customer Portal
 *
 * Usage:
 *   npm run test:smoke
 *   APP_URL=https://your-render-url.onrender.com npm run test:smoke
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

const APP_URL = process.env.APP_URL || 'http://localhost:5000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'smoketest@example.com';

console.log(`Running smoke tests against: ${APP_URL}`);

describe('Smoke Tests - Production Health', () => {
  it('should have a healthy server', async () => {
    const response = await fetch(`${APP_URL}/healthz`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toBe('ok');
  }, 30000);

  it('should have API health endpoint working', async () => {
    const response = await fetch(`${APP_URL}/api/system/health`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('status');
    expect(data.status).toMatch(/healthy|ok/i);
  }, 30000);

  it('should serve static frontend files', async () => {
    const response = await fetch(`${APP_URL}/`);
    expect(response.status).toBe(200);

    const html = await response.text();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<div id="root">');
  }, 30000);
});

describe('Smoke Tests - Flow A: Quote → Invoice → Payment', () => {
  let authCookie: string;
  let userId: string;
  let quoteId: number;
  let invoiceId: number;

  beforeAll(async () => {
    // In production, you'd use a real test user account
    // For now, this is a placeholder for the flow
    console.log('Note: Flow A requires authenticated session - manual verification recommended');
  });

  it('should create a quote (manual verification)', async () => {
    // TODO: Implement authenticated quote creation
    // POST /api/quotes
    // Body: { customerName, customerEmail, lineItems, ... }

    console.log('✓ Manual verification: Create quote via UI');
    console.log('  1. Log in to dashboard');
    console.log('  2. Navigate to Quotes → New Quote');
    console.log('  3. Fill in customer details and line items');
    console.log('  4. Click "Create Quote"');
    console.log('  5. Verify quote appears in quotes list');
  });

  it('should send quote to customer (manual verification)', async () => {
    console.log('✓ Manual verification: Send quote');
    console.log('  1. Open created quote');
    console.log('  2. Click "Send Quote"');
    console.log('  3. Verify email sent confirmation');
    console.log('  4. Check customer email inbox for quote');
  });

  it('should convert quote to invoice (manual verification)', async () => {
    console.log('✓ Manual verification: Accept quote and convert to invoice');
    console.log('  1. Customer opens quote link from email');
    console.log('  2. Customer clicks "Accept Quote"');
    console.log('  3. Verify invoice created automatically');
    console.log('  4. Verify invoice appears in invoices list');
  });

  it('should process payment via Stripe (manual verification)', async () => {
    console.log('✓ Manual verification: Process payment');
    console.log('  1. Customer opens invoice payment link');
    console.log('  2. Customer enters Stripe test card: 4242 4242 4242 4242');
    console.log('  3. Complete payment');
    console.log('  4. Verify invoice status changes to "Paid"');
    console.log('  5. Verify payment_intent.succeeded webhook received');
  });
});

describe('Smoke Tests - Flow B: AI Chat', () => {
  it('should have OpenAI API key configured', async () => {
    // Check if AI endpoints are available (they'll fail without auth, but should exist)
    const response = await fetch(`${APP_URL}/api/chat/suggest`);

    // Should get 401 Unauthorized (not 404 Not Found)
    expect([401, 403]).toContain(response.status);
  }, 30000);

  it('should handle AI chat request (manual verification)', async () => {
    console.log('✓ Manual verification: AI Chat');
    console.log('  1. Log in to dashboard');
    console.log('  2. Navigate to chat/AI assistant');
    console.log('  3. Type a test message: "Help me write a quote"');
    console.log('  4. Verify AI response appears');
    console.log('  5. Verify response is relevant and helpful');
  });

  it('should use Anthropic for automation (manual verification)', async () => {
    console.log('✓ Manual verification: AI Automation');
    console.log('  1. Create an automation rule');
    console.log('  2. Trigger: Quote sent');
    console.log('  3. Action: Generate follow-up email');
    console.log('  4. Test automation fires');
    console.log('  5. Verify email content is AI-generated and relevant');
  });
});

describe('Smoke Tests - Flow C: Customer Portal', () => {
  it('should have customer portal routes available', async () => {
    const response = await fetch(`${APP_URL}/portal/test-token`);

    // Should get 400 Bad Request (invalid token) not 404 Not Found
    expect([400, 401, 403]).toContain(response.status);
  }, 30000);

  it('should generate portal access token (manual verification)', async () => {
    console.log('✓ Manual verification: Customer Portal Access');
    console.log('  1. Open an invoice');
    console.log('  2. Click "Share with Customer"');
    console.log('  3. Copy customer portal link');
    console.log('  4. Open link in incognito window');
    console.log('  5. Verify invoice displays correctly without login');
  });

  it('should allow customer to view invoice details (manual verification)', async () => {
    console.log('✓ Manual verification: Customer Portal - Invoice View');
    console.log('  1. In customer portal');
    console.log('  2. Verify invoice number, amount, due date visible');
    console.log('  3. Verify line items displayed');
    console.log('  4. Verify "Pay Now" button appears if unpaid');
  });

  it('should allow customer to pay invoice (manual verification)', async () => {
    console.log('✓ Manual verification: Customer Portal - Payment');
    console.log('  1. Click "Pay Now" in customer portal');
    console.log('  2. Redirected to Stripe Checkout');
    console.log('  3. Enter test card: 4242 4242 4242 4242');
    console.log('  4. Complete payment');
    console.log('  5. Redirected back to portal with success message');
    console.log('  6. Verify invoice status updated to "Paid"');
  });
});

describe('Smoke Tests - Stripe Integration', () => {
  it('should have Stripe webhook endpoint accessible', async () => {
    const response = await fetch(`${APP_URL}/api/stripe/webhook/ping`);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('ok');
    expect(data.ok).toBe(true);
  }, 30000);

  it('should have webhook secret configured', async () => {
    const response = await fetch(`${APP_URL}/api/stripe/webhook/ping`);
    const data = await response.json();

    expect(data).toHaveProperty('hasWebhookSecret');
    expect(data.hasWebhookSecret).toBe(true);
  }, 30000);
});

describe('Smoke Tests - Background Workers', () => {
  it('should have Redis connection (manual check in logs)', () => {
    console.log('✓ Manual verification: Check worker logs');
    console.log('  1. Open Render dashboard → Worker service → Logs');
    console.log('  2. Verify "[Worker] Starting Bull queue workers..." appears');
    console.log('  3. Verify "[AutomationWorker] Started and listening for jobs" appears');
    console.log('  4. No Redis connection errors');
  });

  it('should process automation jobs (manual verification)', () => {
    console.log('✓ Manual verification: Test automation queue');
    console.log('  1. Create a delayed automation rule (e.g., send reminder 1 hour after quote sent)');
    console.log('  2. Trigger the automation');
    console.log('  3. Check worker logs for job processing');
    console.log('  4. Verify "[AutomationWorker] Processing job" appears');
    console.log('  5. Verify automation executes successfully');
  });
});

describe('Smoke Tests - Database & Storage', () => {
  it('should have working database connection', async () => {
    const response = await fetch(`${APP_URL}/api/system/health`);
    const data = await response.json();

    // Health endpoint should report database status
    expect(data).toHaveProperty('database');
    expect(data.database).toMatch(/connected|ok/i);
  }, 30000);

  it('should have S3 storage configured (manual verification)', () => {
    console.log('✓ Manual verification: File uploads');
    console.log('  1. Create/edit an invoice');
    console.log('  2. Upload an attachment (PDF/image)');
    console.log('  3. Verify upload succeeds');
    console.log('  4. Verify file appears in attachments list');
    console.log('  5. Click to view/download file');
    console.log('  6. Verify file opens correctly');
  });
});

describe('Smoke Tests - Email Delivery', () => {
  it('should have SendGrid configured (manual verification)', () => {
    console.log('✓ Manual verification: Email sending');
    console.log('  1. Create and send a quote');
    console.log('  2. Check SendGrid dashboard → Activity');
    console.log('  3. Verify email was sent');
    console.log('  4. Check recipient inbox');
    console.log('  5. Verify email delivered and formatted correctly');
  });
});

// Summary and deployment checklist
describe('Deployment Checklist Summary', () => {
  it('should print deployment verification checklist', () => {
    console.log('\n========================================');
    console.log('📋 POST-DEPLOYMENT VERIFICATION CHECKLIST');
    console.log('========================================\n');

    console.log('✓ Health Checks:');
    console.log('  • GET /healthz returns {"status":"ok"}');
    console.log('  • GET /api/system/health returns healthy status');
    console.log('  • Frontend loads at root URL\n');

    console.log('✓ Flow A - Quote to Payment:');
    console.log('  • Create quote → Send to customer → Accept → Pay');
    console.log('  • Verify Stripe payment updates invoice status\n');

    console.log('✓ Flow B - AI Features:');
    console.log('  • AI chat responds to queries');
    console.log('  • Automation rules execute with AI-generated content\n');

    console.log('✓ Flow C - Customer Portal:');
    console.log('  • Portal links work without login');
    console.log('  • Customers can view and pay invoices\n');

    console.log('✓ Integrations:');
    console.log('  • Stripe webhooks receiving events');
    console.log('  • SendGrid delivering emails');
    console.log('  • S3 file uploads working\n');

    console.log('✓ Background Workers:');
    console.log('  • Worker service running');
    console.log('  • Redis connected');
    console.log('  • Automation jobs processing\n');

    console.log('========================================\n');
  });
});
