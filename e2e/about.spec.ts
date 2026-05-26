import { test, expect } from '@playwright/test';

/**
 * E2E tests for the About Baalvion frontend (port 3020).
 * baseURL is inherited from playwright.config.ts.
 */

test('homepage loads and title contains Baalvion', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Baalvion/i);
});

test('contact page is navigable from homepage', async ({ page }) => {
  await page.goto('/');
  // Look for a link to /contact (href or text)
  const contactLink = page.locator('a[href*="contact"]').first();
  await expect(contactLink).toBeVisible();
  await contactLink.click();
  await expect(page).toHaveURL(/contact/i);
});

test('unauthenticated user is redirected to /admin/login when accessing /admin', async ({ page }) => {
  await page.goto('/admin');
  // Should redirect to /admin/login
  await expect(page).toHaveURL(/\/admin\/login/);
});
