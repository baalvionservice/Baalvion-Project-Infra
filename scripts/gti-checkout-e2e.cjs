/* GTI checkout browser E2E — logs in, opens an unpaid order, verifies the gateway picker renders
   and the Razorpay popup opens. Confirms the new consumer-checkout UI works in a real browser. */
const { chromium } = require('@playwright/test');

const BASE = process.env.BASE || 'http://localhost:9003';
const ORDER = process.env.ORDER || '4481d6f2-adbd-425a-8d7a-0cc10a328b1e';
const EMAIL = 'superadmin@baalvion.com';
const PASS = process.env.SUPERADMIN_PASSWORD;
const SHOT = process.env.SHOT_DIR || 'd:/_baalvion_scratch/gti-e2e';
const fs = require('fs');
try { fs.mkdirSync(SHOT, { recursive: true }); } catch {}

const results = [];
const rec = (name, ok, detail) => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`); };

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') console.log(`   [console.error] ${m.text().slice(0, 150)}`); });
  try {
    // 1) Login
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.fill('#email', EMAIL);
    await page.fill('#password', PASS);
    await page.click('button[type=submit]');
    await page.waitForURL((u) => !u.pathname.endsWith('/login'), { timeout: 30000 }).catch(() => {});
    rec('login', !page.url().endsWith('/login'), `at ${new URL(page.url()).pathname}`);

    // 2) Create an order IN THIS SESSION (so it lands in the session's tenant + is visible). Uses the
    // app's own /trade-bff proxy with the csrf_token cookie → x-csrf-token header, like the apiClient.
    const orderId = await page.evaluate(async () => {
      const csrf = (document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/) || [])[1] || '';
      const r = await fetch('/trade-bff/orders', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json', 'x-csrf-token': csrf },
        body: JSON.stringify({ lines: [{ product_id: 'browser-e2e', quantity: 1, unit_price: 1200 }], currency: 'INR', destination_country: 'IN' }),
      });
      const j = await r.json().catch(() => ({}));
      return (j && j.data && j.data.id) || (j && j.id) || null;
    });
    rec('create order in-session', !!orderId, orderId ? String(orderId).slice(0, 8) : 'failed');
    const useId = orderId || ORDER;

    // 3) Open the unpaid order
    await page.goto(`${BASE}/orders/${useId}`, { waitUntil: 'domcontentloaded' });
    await page.getByText('Pay by Gateway', { exact: false }).waitFor({ timeout: 30000 });
    rec('order-page + gateway picker renders', true);

    // 3) All 4 gateway tiles present
    let tiles = 0;
    for (const label of ['Card · UPI', 'International Card', 'International', 'Bank Transfer']) {
      tiles += await page.getByText(label, { exact: false }).count();
    }
    rec('all gateway tiles render', tiles >= 4, `${tiles} matches`);
    await page.screenshot({ path: `${SHOT}/gti-gateway-picker.png`, fullPage: true });

    // 4) Razorpay → popup opens
    await page.getByText('Card · UPI', { exact: false }).first().click();
    await page.getByRole('button', { name: /^pay /i }).click();
    const frame = await page.waitForSelector('iframe[src*="razorpay"]', { timeout: 30000 }).then(() => true).catch(() => false);
    await page.screenshot({ path: `${SHOT}/gti-razorpay.png`, fullPage: true });
    rec('razorpay popup opens', frame, frame ? 'razorpay iframe present' : 'no razorpay iframe');
  } catch (e) {
    rec('run', false, e.message.slice(0, 160));
    try { await page.screenshot({ path: `${SHOT}/gti-FAIL.png`, fullPage: true }); } catch {}
  } finally {
    await ctx.close();
    await browser.close();
  }
  const passed = results.filter(Boolean).length;
  console.log(`\n=== ${passed}/${results.length} checks passed ===  (shots: ${SHOT})`);
  process.exit(passed === results.length ? 0 : 1);
})().catch((e) => { console.error('RUNNER ERROR:', e); process.exit(2); });
