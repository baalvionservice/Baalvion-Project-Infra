#!/usr/bin/env node
/**
 * Admin console health sweep — answers "what is working and what is not".
 *
 * Two passes:
 *   1. Ports: which backend services the console depends on are actually listening.
 *   2. Pages: logs in once, then visits every static route and records console errors,
 *      failed requests (grouped by the service that refused), 4xx/5xx and visible
 *      error states.
 *
 * Pages are classed as:
 *   BROKEN   — a JS error, crash or non-200 document. A real defect.
 *   DEGRADED — renders, but a backend it needs is down or returned 4xx/5xx.
 *   OK       — renders clean.
 *
 * Usage:
 *   node scripts/admin-health-sweep.mjs
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... BASE_URL=http://localhost:3030 node scripts/admin-health-sweep.mjs
 *
 * Note: /login is rate-limited to 10 attempts per 15 min per IP and counts SUCCESSFUL
 * logins too, so this signs in exactly once and reuses the tab. If you hit the limit,
 * flush `auth:login_*` from Redis AND restart auth-service (one limiter is in-memory).
 */
// @playwright/test is the workspace's declared dependency; plain `playwright` is only a
// transitive package and does not resolve from the repo root.
import { chromium } from '@playwright/test';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createConnection } from 'node:net';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3030';
const EMAIL = process.env.ADMIN_EMAIL || 'sa.test@baalvion.local';
const PASSWORD = process.env.ADMIN_PASSWORD || 'TestPass!2026';
const APP_DIR = process.env.APP_DIR
  || join(process.cwd(), 'Frontend/admin-platform/src/app');

// Ports the console talks to, from src/lib/api/client.ts + .env.local.
const SERVICES = {
  3001: 'auth', 3021: 'admin', 3018: 'cms', 3099: 'gateway', 3022: 'session', 3023: 'oauth',
  3002: 'jobs', 3003: 'mining', 3004: 'imperialpedia', 3005: 'real-estate', 3006: 'brand',
  3007: 'market', 3008: 'ir', 3009: 'dashboard-svc', 3020: 'about', 3017: 'ctm',
  3012: 'commerce', 3013: 'orders', 3014: 'inventory', 3016: 'fulfillment', 3015: 'law',
  3055: 'rbac', 3032: 'audit', 3031: 'notifications', 3060: 'marketplace', 3063: 'crm',
  3045: 'news',
};

const isListening = (port) =>
  new Promise((resolve) => {
    const s = createConnection({ port, host: '127.0.0.1' })
      .on('connect', () => { s.destroy(); resolve(true); })
      .on('error', () => resolve(false));
    s.setTimeout(1200, () => { s.destroy(); resolve(false); });
  });

// Every static route: app-router page.tsx, minus (groups) and [dynamic] segments.
function collectRoutes(dir, prefix = '') {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry.startsWith('[')) continue;
      const seg = entry.startsWith('(') && entry.endsWith(')') ? prefix : `${prefix}/${entry}`;
      out.push(...collectRoutes(full, seg));
    } else if (entry === 'page.tsx') {
      out.push(prefix || '/');
    }
  }
  return out;
}

const SKIP = new Set(['/login', '/forgot-password', '/mfa', '/welcome', '/invite']);

async function main() {
  console.log('── Services ' + '─'.repeat(48));
  const down = [];
  for (const [port, name] of Object.entries(SERVICES)) {
    const up = await isListening(Number(port));
    if (!up) down.push(name);
    console.log(`${up ? 'UP  ' : 'DOWN'}  :${port}  ${name}`);
  }
  console.log(`\n${Object.keys(SERVICES).length - down.length}/${Object.keys(SERVICES).length} services up`
    + (down.length ? ` — down: ${down.join(', ')}` : ''));

  const routes = [...new Set(collectRoutes(APP_DIR))].filter((r) => !SKIP.has(r)).sort();
  console.log(`\n── Pages (${routes.length}) ` + '─'.repeat(44));

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });


  const signIn = async () => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 90_000 });
    await page.waitForTimeout(2000);
    await page.fill('#email', EMAIL);
    await page.fill('#password', PASSWORD);
    await page.click('button[type=submit]');
    await page.waitForURL(/welcome|dashboard/, { timeout: 30_000 });
    await page.waitForTimeout(4000);
  };

  try {
    await signIn();
  } catch {
    console.error('\nLogin did not complete — check the credentials, or the rate limiter (see header).');
    await browser.close();
    process.exit(1);
  }

  const results = [];
  let reAuths = 0;
  for (const route of routes) {
    const errs = new Set(), refused = new Set(), http = new Set();
    const onConsole = (m) => {
      if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errs.add(m.text().slice(0, 150));
    };
    const onPageError = (e) => errs.add('JS: ' + e.message.slice(0, 150));
    const onFailed = (r) => {
      const m = r.url().match(/localhost:(\d+)/);
      if (m && /CONNECTION_REFUSED/.test(r.failure()?.errorText || '')) refused.add(SERVICES[m[1]] || `:${m[1]}`);
    };
    const onResponse = (r) => {
      if (r.status() < 400 || r.url().includes('_rsc')) return;
      const m = r.url().match(/localhost:(\d+)/);
      http.add(`${r.status()}@${m ? (SERVICES[m[1]] || m[1]) : 'app'}`);
    };
    page.on('console', onConsole); page.on('pageerror', onPageError);
    page.on('requestfailed', onFailed); page.on('response', onResponse);

    let status = 0, signal = 'ok';
    try {
      // `next dev` compiles each route on first visit (15-20s, ~4800 modules) and stops
      // accepting connections while it does, so a refusal/timeout is usually saturation,
      // not a defect. Retry once before believing it.
      let resp;
      try {
        resp = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      } catch (first) {
        if (!/ERR_CONNECTION_REFUSED|ERR_EMPTY_RESPONSE|Timeout/.test(String(first.message))) throw first;
        await page.waitForTimeout(5000);
        resp = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      }
      status = resp?.status() ?? 0;
      await page.waitForTimeout(2500);

      // Bounced to /login → the session died (expiry, or a refresh-token rotation we lost).
      // Without this, every remaining route scores BROKEN and the report is worthless.
      if (new URL(page.url()).pathname.startsWith('/login')) {
        if (reAuths >= 2) throw new Error('session keeps dropping — aborting sweep');
        reAuths += 1;
        console.log(`          …session dropped, signing back in (${reAuths})`);
        await signIn();
        resp = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
        status = resp?.status() ?? 0;
        await page.waitForTimeout(2500);
      }

      const body = (await page.locator('body').innerText()).slice(0, 5000);
      if (/Application error|client-side exception|Unhandled Runtime Error/i.test(body)) signal = 'crash';
      else if (/something went wrong|failed to load|unable to load|error loading/i.test(body)) signal = 'error-state';
      else if (body.trim().length < 40) signal = 'blank';
    } catch (e) {
      signal = 'timeout';
      errs.add('NAV: ' + String(e.message).slice(0, 100));
    }

    page.off('console', onConsole); page.off('pageerror', onPageError);
    page.off('requestfailed', onFailed); page.off('response', onResponse);

    const verdict = (signal === 'crash' || signal === 'timeout' || errs.size || status >= 400) ? 'BROKEN'
      : (refused.size || http.size || signal === 'error-state' || signal === 'blank') ? 'DEGRADED' : 'OK';
    results.push({ route, verdict, status, signal, refused: [...refused], http: [...http], errors: [...errs] });
    console.log(`${verdict.padEnd(9)} ${String(status).padEnd(4)} ${route}`
      + (refused.size ? `  needs: ${[...refused].join(',')}` : '')
      + (http.size ? `  http: ${[...http].join(',')}` : '')
      + (errs.size ? `  ${[...errs][0].slice(0, 80)}` : ''));
    await page.waitForTimeout(400); // don't stampede the dev server
  }
  await browser.close();

  const by = (v) => results.filter((r) => r.verdict === v);
  console.log(`\n── Summary ` + '─'.repeat(49));
  console.log(`OK ${by('OK').length} | DEGRADED ${by('DEGRADED').length} | BROKEN ${by('BROKEN').length}`);
  if (by('BROKEN').length) {
    console.log('\nBROKEN — real defects:');
    by('BROKEN').forEach((r) => console.log(`  ${r.route}  ${r.errors[0] ?? r.signal}`));
  }
  const out = relative(process.cwd(), join(process.cwd(), 'admin-health.json'));
  writeFileSync('admin-health.json', JSON.stringify(results, null, 2));
  console.log(`\nFull detail → ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
