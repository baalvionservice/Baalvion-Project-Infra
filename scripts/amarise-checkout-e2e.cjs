/* Amarisé checkout browser E2E — drives the REAL UI (guest checkout) across all 4 gateways.
   Verifies: gateway tiles render, bank-transfer shows instructions, PayU navigates to its hosted
   page, Stripe (no keys) fails cleanly (no fake success), Razorpay opens its popup. */
const { chromium } = require('@playwright/test');

const BASE = process.env.BASE || 'http://localhost:3033';
const PRODUCT = 'b282702a-5e47-4127-b34f-504190ebf307'; // Chanel Classic Long Wallet ($1,450)
const SHOT = (process.env.SHOT_DIR || 'd:/_baalvion_scratch/amarise-e2e');
const fs = require('fs');
try { fs.mkdirSync(SHOT, { recursive: true }); } catch {}

const results = [];
const rec = (name, ok, detail) => { results.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };

async function toCheckout(page) {
  await page.goto(`${BASE}/us/product/${PRODUCT}`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /add to bag/i }).first().click({ timeout: 20000 });
  // Cart drawer opens with a "Checkout" button that client-navigates (preserves the in-memory cart).
  await page.getByRole('button', { name: /^\s*checkout/i }).first().click({ timeout: 15000 });
  await page.waitForURL(/\/checkout/, { timeout: 20000 });
}

async function fillShipping(page) {
  await page.fill('#checkout-first-name', 'Test');
  await page.fill('#checkout-last-name', 'Buyer');
  await page.fill('#checkout-address1', '730 Fifth Avenue');
  await page.fill('#checkout-city', 'New York');
  await page.fill('#checkout-region', 'NY');
  await page.fill('#checkout-zip', '10019');
  await page.fill('#checkout-country', 'US');
  await page.fill('#checkout-phone', '+12125550100');
  await page.getByRole('button', { name: /continue to payment/i }).click({ timeout: 15000 });
  await page.getByText('Bank Transfer', { exact: false }).first().waitFor({ timeout: 20000 });
}

async function scenario(browser, name, fn) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log(`   [console.error] ${m.text().slice(0, 160)}`); });
  try {
    await toCheckout(page);
    // Verify all 4 gateway tiles render once on the payment step.
    await fillShipping(page);
    for (const label of ['Card', 'UPI & Netbanking', 'International', 'Bank Transfer']) {
      const n = await page.getByText(label, { exact: false }).count();
      if (!n) throw new Error(`gateway tile missing: ${label}`);
    }
    await fn(page);
  } catch (e) {
    rec(name, false, e.message);
    try { await page.screenshot({ path: `${SHOT}/${name}-FAIL.png`, fullPage: true }); } catch {}
  } finally {
    await ctx.close();
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // A — Bank transfer: full happy path → confirmation with REAL wire instructions.
  await scenario(browser, 'gateway-tiles-render', async () => { rec('gateway-tiles-render', true, 'all 4 tiles present'); });

  await scenario(browser, 'bank-transfer', async (page) => {
    await page.getByText('Bank Transfer', { exact: false }).first().click();
    await page.getByRole('button', { name: /place order/i }).click();
    await page.getByRole('heading', { name: 'Order Confirmed' }).waitFor({ timeout: 30000 });
    await page.getByText('Bank Transfer Instructions', { exact: false }).waitFor({ timeout: 10000 });
    const remit = await page.getByText(/remit|reference/i).first().innerText().catch(() => '');
    await page.screenshot({ path: `${SHOT}/bank-confirmation.png`, fullPage: true });
    rec('bank-transfer', true, `instructions shown: "${remit.slice(0, 70)}"`);
  });

  // C — Stripe (no keys): MUST fail cleanly, NOT show "Order Confirmed".
  await scenario(browser, 'stripe-fails-safe', async (page) => {
    await page.getByText('Card', { exact: false }).first().click();
    await page.getByRole('button', { name: /place order/i }).click();
    // Expect an error toast; assert "Order Confirmed" does NOT appear.
    const failToast = page.getByText(/Order Failed|could not|payment unavailable|initialise/i).first();
    const confirmed = page.getByText('Order Confirmed', { exact: false }).first();
    const winner = await Promise.race([
      failToast.waitFor({ timeout: 20000 }).then(() => 'fail-toast').catch(() => null),
      confirmed.waitFor({ timeout: 20000 }).then(() => 'confirmed').catch(() => null),
    ]);
    await page.screenshot({ path: `${SHOT}/stripe-result.png`, fullPage: true });
    if (winner === 'confirmed') throw new Error('Stripe with no keys WRONGLY showed Order Confirmed');
    rec('stripe-fails-safe', winner === 'fail-toast', winner === 'fail-toast' ? 'clean error, no fake success' : 'no clear outcome');
  });

  // B — PayU: placing the order must navigate the browser to PayU's hosted page.
  await scenario(browser, 'payu-redirect', async (page) => {
    await page.getByText('International', { exact: false }).first().click();
    const navP = page.waitForURL(/payu\.in/i, { timeout: 30000 }).then(() => true).catch(() => false);
    await page.getByRole('button', { name: /place order/i }).click();
    const navigated = await navP;
    await page.screenshot({ path: `${SHOT}/payu-result.png`, fullPage: true });
    rec('payu-redirect', navigated, navigated ? `reached ${new URL(page.url()).host}` : `still on ${new URL(page.url()).host}`);
  });

  // D — Razorpay: placing the order must open the Razorpay checkout (iframe/popup).
  await scenario(browser, 'razorpay-popup', async (page) => {
    await page.getByText('UPI & Netbanking', { exact: false }).first().click();
    await page.getByRole('button', { name: /place order/i }).click();
    const frame = await page.waitForSelector('iframe[src*="razorpay"]', { timeout: 30000 }).then(() => true).catch(() => false);
    await page.screenshot({ path: `${SHOT}/razorpay-result.png`, fullPage: true });
    rec('razorpay-popup', frame, frame ? 'razorpay checkout iframe opened' : 'no razorpay iframe detected');
  });

  await browser.close();
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n=== ${passed}/${results.length} checks passed ===`);
  console.log(`screenshots: ${SHOT}`);
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => { console.error('RUNNER ERROR:', e); process.exit(2); });
