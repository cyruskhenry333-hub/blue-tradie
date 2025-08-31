import { test, expect, type Page } from '@playwright/test';

test.describe('Invoice Payment Flow', () => {
  test('Create invoice → generate pay link → complete test checkout → webhook marks PAID → persists after re-login', async ({ page }) => {
    console.log('🎬 Starting invoice payment E2E test');
    
    // Step 1: Login as demo user
    console.log('📍 Step 1: Login as demo user');
    await page.goto('/demo');
    await page.fill('input[type="password"]', 'Demo10292');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|\//, { timeout: 15000 });
    
    // Step 2: Navigate to invoices and create new invoice
    console.log('📍 Step 2: Create new invoice');
    await page.goto('/invoices');
    await page.click('button:has-text("New Invoice")');
    
    // Fill invoice details
    await page.fill('input[name="clientName"]', 'Test Customer Ltd');
    await page.fill('input[name="clientEmail"]', 'test@example.com');
    await page.fill('textarea[name="description"]', 'Electrical maintenance work');
    await page.fill('input[name="amount"]', '550');
    
    // Save invoice
    await page.click('button:has-text("Create Invoice")');
    
    // Wait for invoice to be created and get invoice ID
    await page.waitForSelector('[data-testid="invoice-list"]');
    const invoiceElement = page.locator('[data-testid="invoice-item"]').first();
    await expect(invoiceElement).toBeVisible();
    
    console.log('✅ Step 2 PASSED: Invoice created successfully');
    
    // Step 3: Generate payment link
    console.log('📍 Step 3: Generate payment link');
    await invoiceElement.click();
    
    // Wait for invoice detail view
    await page.waitForSelector('button:has-text("Send Invoice")');
    await page.click('button:has-text("Send Invoice")');
    
    // Wait for payment link generation
    await expect(page.locator('text=Payment link generated')).toBeVisible({ timeout: 10000 });
    console.log('✅ Step 3 PASSED: Payment link generated');
    
    // Step 4: Navigate to payment link (simulate customer payment)
    console.log('📍 Step 4: Open payment link in new tab');
    const paymentLinkElement = page.locator('a:has-text("View Payment Link")');
    const paymentUrl = await paymentLinkElement.getAttribute('href');
    
    // Open payment page in new context (simulate customer)
    const customerContext = await page.context().browser()?.newContext();
    const customerPage = await customerContext?.newPage();
    if (!customerPage || !paymentUrl) {
      throw new Error('Failed to create customer context or get payment URL');
    }
    
    await customerPage.goto(paymentUrl);
    await expect(customerPage.locator('text=Test Customer Ltd')).toBeVisible();
    await expect(customerPage.locator('text=$550')).toBeVisible();
    console.log('✅ Step 4 PASSED: Payment page loaded with correct details');
    
    // Step 5: Complete test payment (Stripe test mode)
    console.log('📍 Step 5: Complete test payment');
    await customerPage.click('button:has-text("Pay Now")');
    
    // Fill Stripe test card details
    const stripeFrame = customerPage.frameLocator('iframe[name^="__privateStripeFrame"]');
    await stripeFrame.locator('input[name="cardnumber"]').fill('4242424242424242');
    await stripeFrame.locator('input[name="exp-date"]').fill('12/34');
    await stripeFrame.locator('input[name="cvc"]').fill('123');
    await stripeFrame.locator('input[name="postal"]').fill('12345');
    
    // Submit payment
    await customerPage.click('button:has-text("Pay")');
    
    // Wait for success page
    await customerPage.waitForURL(/invoice.*success/, { timeout: 30000 });
    await expect(customerPage.locator('text=Payment Successful')).toBeVisible();
    console.log('✅ Step 5 PASSED: Test payment completed successfully');
    
    // Close customer context
    await customerContext?.close();
    
    // Step 6: Verify webhook processed payment and updated invoice status
    console.log('📍 Step 6: Verify invoice status updated via webhook');
    await page.reload();
    
    // Check if invoice status is now PAID
    await page.waitForSelector('text=PAID', { timeout: 10000 });
    await expect(page.locator('text=PAID')).toBeVisible();
    console.log('✅ Step 6 PASSED: Invoice status updated to PAID via webhook');
    
    // Step 7: Logout and re-login to verify persistence
    console.log('📍 Step 7: Test payment persistence after re-login');
    await page.evaluate(() => {
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    });
    
    // Re-login
    await page.goto('/demo');
    await page.fill('input[type="password"]', 'Demo10292');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard|\//, { timeout: 15000 });
    
    // Navigate back to invoices
    await page.goto('/invoices');
    await page.waitForSelector('[data-testid="invoice-list"]');
    
    // Verify payment status persists
    await expect(page.locator('text=PAID')).toBeVisible();
    console.log('✅ Step 7 PASSED: Payment status persisted after re-login');
    
    console.log('🎉 Invoice Payment E2E Test COMPLETED SUCCESSFULLY');
  });
  
  test('Health endpoint returns correct status', async ({ page }) => {
    console.log('🩺 Testing health endpoint');
    
    const response = await page.request.get('/health');
    expect(response.status()).toBe(200);
    
    const healthData = await response.json();
    expect(healthData.ok).toBe(true);
    expect(healthData.version).toBeDefined();
    expect(healthData.db).toBe(true);
    
    console.log('✅ Health endpoint test passed');
  });
});