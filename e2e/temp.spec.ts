import { test, expect } from '@playwright/test';
 
test('should navigate to login page and see username input', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[placeholder="用户名"]')).toBeVisible();
}); 