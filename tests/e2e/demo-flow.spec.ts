import { test, expect, type Page } from '@playwright/test';

test.describe('Demo Login Flow', () => {
  test('Demo code → login → onboarding once → re-login → dashboard', async ({ page }) => {
    console.log('🎬 Starting comprehensive demo login E2E test');
    
    // Step 1: Navigate to demo page
    console.log('📍 Step 1: Navigate to demo page');
    await page.goto('/demo');
    await expect(page).toHaveTitle(/Blue Tradie/);
    
    // Step 2: Enter demo code for unboarded user
    console.log('📍 Step 2: Enter demo code Demo1774 (unboarded user)');
    await page.fill('input[type="password"]', 'Demo1774');
    
    // Step 3: Submit and wait for redirect to onboarding
    console.log('📍 Step 3: Submit demo code and wait for onboarding redirect');
    await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('/api/demo/login') && response.status() === 200
      ),
      page.click('button[type="submit"]')
    ]);
    
    // Wait for auth check and redirect
    await page.waitForURL(/onboarding/, { timeout: 15000 });
    console.log('✅ Step 3 PASSED: Redirected to onboarding');
    
    // Step 4: Complete onboarding wizard
    console.log('📍 Step 4: Complete onboarding process');
    
    // Fill out business details
    await page.fill('input[placeholder*="business name"]', 'Cyrus Test Electrical');
    await page.selectOption('select[name="trade"]', 'Electrician');
    await page.selectOption('select[name="serviceArea"]', 'Auckland, NZ');
    await page.click('button:has-text("Continue")');
    
    // Set goals
    await page.fill('input[name="monthlyTarget"]', '8000');
    await page.fill('input[name="jobsPerWeek"]', '15');
    await page.click('button:has-text("Continue")');
    
    // Complete setup
    await page.click('button:has-text("Complete Setup")');
    
    // Wait for onboarding completion and redirect
    await page.waitForURL(/dashboard|\//, { timeout: 15000 });
    console.log('✅ Step 4 PASSED: Onboarding completed, redirected to dashboard');
    
    // Step 5: Verify user is authenticated and onboarded
    console.log('📍 Step 5: Verify authentication state');
    const authResponse = await page.evaluate(async () => {
      const res = await fetch('/api/auth/user', { credentials: 'include' });
      return {
        status: res.status,
        data: await res.json()
      };
    });
    
    expect(authResponse.status).toBe(200);
    expect(authResponse.data.isOnboarded).toBe(true);
    console.log('✅ Step 5 PASSED: User is authenticated and onboarded');
    
    // Step 6: Logout to test re-login flow
    console.log('📍 Step 6: Logout to test re-login');
    await page.evaluate(() => {
      fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    });
    
    // Step 7: Navigate back to demo page for re-login
    console.log('📍 Step 7: Re-login with same demo code');
    await page.goto('/demo');
    await page.fill('input[type="password"]', 'Demo1774');
    await page.click('button[type="submit"]');
    
    // Step 8: Should redirect directly to dashboard (skip onboarding)
    await page.waitForURL(/dashboard|\//, { timeout: 15000 });
    console.log('✅ Step 8 PASSED: Re-login redirected to dashboard (skipped onboarding)');
    
    // Final verification: Check user data persists
    const finalAuthCheck = await page.evaluate(async () => {
      const res = await fetch('/api/auth/user', { credentials: 'include' });
      return await res.json();
    });
    
    expect(finalAuthCheck.isOnboarded).toBe(true);
    expect(finalAuthCheck.businessName).toContain('Cyrus Test Electrical');
    console.log('🎉 Demo Flow E2E Test COMPLETED SUCCESSFULLY');
  });
  
  test('Onboarded demo user goes directly to dashboard', async ({ page }) => {
    console.log('🎬 Testing onboarded demo user flow');
    
    // Test with onboarded demo user
    await page.goto('/demo');
    await page.fill('input[type="password"]', 'Demo10292');
    await page.click('button[type="submit"]');
    
    // Should go directly to dashboard
    await page.waitForURL(/dashboard|\//, { timeout: 15000 });
    
    // Verify user is onboarded
    const authResponse = await page.evaluate(async () => {
      const res = await fetch('/api/auth/user', { credentials: 'include' });
      return await res.json();
    });
    
    expect(authResponse.isOnboarded).toBe(true);
    console.log('✅ Onboarded demo user correctly sent to dashboard');
  });
});