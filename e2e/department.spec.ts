import { test, expect } from '@playwright/test';

test.describe('Department Management E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Add event listeners for comprehensive logging
    page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));
    page.on('pageerror', err => console.error(`[Page Error] ${err.message}`));
    page.on('request', request => console.log(`[Network Request] >> ${request.method()} ${request.url()}`));
    page.on('response', async response => {
      console.log(`[Network Response] << ${response.status()} ${response.url()}`);
      try {
        const responseBody = await response.text();
        console.log(`[Network Response Body] ${response.url()}: ${responseBody.substring(0, 500)}...`); // Log first 500 chars of body
      } catch (e) {
        console.log(`[Network Response Body] Could not read response body for ${response.url()}`);
      }
    });

    console.log('[Playwright] Navigating to login page...');
    await page.goto('http://localhost:5173/login');
    console.log('[Playwright] Login page navigated. Waiting for DOM content loaded...');
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 }); // Wait for DOM content to be loaded
    console.log('[Playwright] DOM content loaded. Taking screenshot...');
    await page.screenshot({ path: './test-results/login-page-before-username-selector.png' }); // Take screenshot here
    console.log('[Playwright] Screenshot taken. Waiting for username input via placeholder...');
    await page.getByPlaceholder('用户名').waitFor({ state: 'visible', timeout: 60000 }); // Wait for username input field to be visible
    console.log('[Playwright] Username input visible. Waiting for password input via placeholder...');
    await page.getByPlaceholder('密码').waitFor({ state: 'visible', timeout: 60000 }); // Wait for password input field to be visible
    console.log('[Playwright] Password input visible. Filling credentials...');

    // Type in credentials
    await page.getByPlaceholder('用户名').fill('admin');
    await page.getByPlaceholder('密码').fill('123456');
    console.log('[Playwright] Credentials filled. Waiting for login button via role...');

    // Click the login button
    await page.getByRole('button', { name: '登录' }).waitFor({ state: 'visible', timeout: 60000 }); // Wait for login button to be visible
    await page.getByRole('button', { name: '登录' }).click();
    console.log('[Playwright] Login button clicked. Waiting for login API response...');

    // Wait for the login API request to complete and ensure successful authentication
    await page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.status() === 200
    , { timeout: 60000 });
    console.log('[Playwright] Login API response received. Waiting for dashboard navigation...');

    // Capture screenshot right before waiting for dashboard URL
    await page.screenshot({ path: './test-results/dashboard-navigation-before-wait.png' });
    console.log('[Playwright] Screenshot captured before dashboard navigation wait.');

    // Wait for navigation to dashboard or main page after successful login
    await page.waitForURL('http://localhost:5173/dashboard', { timeout: 60000 }); 
    await page.waitForLoadState('load', { timeout: 60000 }); // Ensure all resources are loaded
    console.log('[Playwright] Navigated to dashboard. Clearing storage...');

    // Ensure page is fully loaded and interactive before attempting to clear storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    console.log('[Playwright] Storage cleared. Navigating to Department Management page...');

    // Navigate to the Department Management page
    await page.click('text=部门管理');
    await page.waitForURL('http://localhost:5173/department', { timeout: 60000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
    console.log('[Playwright] Navigated to Department Management page.');
  });

  test('should display department list', async ({ page }) => {
    // Verify that the table is visible
    await expect(page.locator('.el-table')).toBeVisible();
    // Verify that there is at least one department listed (assuming initial data)
    await expect(page.locator('.el-table__row')).toBeVisible();
    console.log('部门列表显示正常。');
  });

  // Tests will be added here incrementally
}); 