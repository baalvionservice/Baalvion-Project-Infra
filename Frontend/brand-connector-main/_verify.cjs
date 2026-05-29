/* Browser verification for brand-connector (de-Firebase'd, same-origin BFF, prod build). */
const { chromium } = require('D:/Baalvion Projects/node_modules/.pnpm/playwright-core@1.60.0/node_modules/playwright-core');

const BASE = 'http://localhost:3035';
const EMAIL = 'brand-admin@baalvion.test';
const PASS = 'Passw0rd!23';

const ROUTES = [
  '/dashboard/brand',
  '/dashboard/brand/campaigns',
  '/dashboard/brand/creators',
  '/dashboard/notifications',
  '/dashboard/brand/billing',
  '/admin',
  '/admin/campaigns',
  '/admin/disputes',
  '/admin/users',
  '/admin/plans',
];

const IGNORE = [
  /Download the React DevTools/i,
  /\[Fast Refresh\]/i,
  /favicon/i,
];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const consoleErrors = [];
  const failedApi = [];
  const apiCalls = new Set();

  page.on('console', (m) => {
    if (m.type() === 'error') {
      const t = m.text();
      if (!IGNORE.some((re) => re.test(t))) consoleErrors.push(t);
    }
  });
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));
  page.on('response', (res) => {
    const u = res.url();
    if (/\/(api|brand-bff|auth-bff)\//.test(u)) {
      const path = u.replace(BASE, '');
      if (res.status() < 400) apiCalls.add(`${res.status()} ${path.split('?')[0]}`);
      else failedApi.push(`${res.status()} ${path.split('?')[0]}`);
    }
  });

  // ---- Login ----
  await page.goto(`${BASE}/auth/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASS);
  await page.click('button[type=submit]');
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });
    console.log('LOGIN: ok ->', page.url().replace(BASE, ''));
  } catch {
    console.log('LOGIN: FAILED (no dashboard redirect). url=', page.url().replace(BASE, ''));
    const err = await page.locator('[role=alert]').first().textContent().catch(() => null);
    if (err) console.log('  form error:', err.trim());
  }

  // ---- Visit routes ----
  // domcontentloaded (not networkidle): pages poll every 5s (onSnapshot shim), so the network
  // never goes idle. Pause between routes so we measure real behaviour, not a request storm.
  const perRoute = {};
  for (const r of ROUTES) {
    await page.waitForTimeout(2000);
    consoleErrors.length = 0;
    failedApi.length = 0;
    try {
      await page.goto(`${BASE}${r}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
    } catch (e) {
      perRoute[r] = { nav: 'NAV-ERR ' + e.message.split('\n')[0] };
      continue;
    }
    const bodyLen = (await page.locator('body').innerText().catch(() => '')).length;
    perRoute[r] = {
      errors: [...consoleErrors],
      failedApi: [...failedApi],
      bodyLen,
    };
  }

  console.log('\n=== BACKEND CALLS OBSERVED (status path) ===');
  console.log([...apiCalls].sort().join('\n') || '(none)');

  console.log('\n=== PER-ROUTE ===');
  for (const r of ROUTES) {
    const x = perRoute[r];
    const tag = x.nav ? x.nav : `body=${x.bodyLen}ch errs=${x.errors.length} failedApi=${x.failedApi.length}`;
    console.log(`${r.padEnd(34)} ${tag}`);
    (x.errors || []).slice(0, 4).forEach((e) => console.log('    ERR  ' + e.slice(0, 200)));
    (x.failedApi || []).slice(0, 6).forEach((e) => console.log('    API  ' + e));
  }

  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
