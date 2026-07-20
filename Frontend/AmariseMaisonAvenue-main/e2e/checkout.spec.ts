import { test, expect } from '@playwright/test';

// Checkout golden-path smoke test. Requires the full stack running against a real DB
// (commerce/order/inventory/auth services) — see playwright.config.ts. This spec verifies the
// guest checkout form renders and accepts input; it stops short of submitting a real payment
// (that requires a configured sandbox gateway and a non-empty cart seeded by an earlier step
// in the actual purchase journey, which is out of scope for a static smoke test).

test.describe('Checkout', () => {
  test('homepage loads for the default market', async ({ page }) => {
    await page.goto('/us');
    await expect(page).toHaveTitle(/./);
  });

  test('guest checkout form renders all required shipping fields and accepts input', async ({ page }) => {
    await page.goto('/us/checkout');

    const firstName = page.getByPlaceholder('Julian');
    const lastName = page.getByPlaceholder('Vandervilt');
    const email = page.getByPlaceholder('you@example.com');
    const addressLine1 = page.getByPlaceholder('730 Fifth Avenue');
    const city = page.getByPlaceholder('New York');
    const state = page.getByPlaceholder('NY');
    const postalCode = page.getByPlaceholder('10019');
    const phone = page.getByPlaceholder('+1 212 555 0100');

    await expect(firstName).toBeVisible();
    await expect(lastName).toBeVisible();
    await expect(email).toBeVisible();

    await firstName.fill('Test');
    await lastName.fill('Shopper');
    await email.fill('e2e-test@example.com');
    await addressLine1.fill('1 Test Avenue');
    await city.fill('New York');
    await state.fill('NY');
    await postalCode.fill('10001');
    await phone.fill('+1 212 555 0199');

    await expect(firstName).toHaveValue('Test');
    await expect(email).toHaveValue('e2e-test@example.com');
  });
});
