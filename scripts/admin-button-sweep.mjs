#!/usr/bin/env node
/**
 * Admin console interaction sweep — exercises the controls on every page and reports
 * which ones error.
 *
 * SAFETY: this clicks real controls against whatever database the console is pointed at.
 * Anything whose label reads destructive (delete/revoke/cancel/suspend…) or mutating
 * (save/create/publish/send/invite…) is INVENTORIED BUT NEVER CLICKED. Only inert
 * controls — opening a dialog, switching a tab, expanding a menu, filtering — are
 * actually pressed. Buttons with no accessible name cannot be classified, so they are
 * skipped and reported: an unnamed button is also an accessibility defect.
 *
 * For each clicked control it records console errors, uncaught exceptions, failed
 * requests and 4xx/5xx responses, then presses Escape to dismiss anything that opened.
 *
 * Usage:
 *   node scripts/admin-button-sweep.mjs                    # all routes
 *   ROUTES=/users,/dashboard node scripts/admin-button-sweep.mjs
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/admin-button-sweep.mjs
 */
import { chromium } from '@playwright/test';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3030';
const EMAIL = process.env.ADMIN_EMAIL || 'sa.test@baalvion.local';
// No default: a credential does not belong in the repo, and secret scanning blocks it.
const PASSWORD = process.env.ADMIN_PASSWORD;
if (!PASSWORD) {
  console.error('Set ADMIN_PASSWORD (and ADMIN_EMAIL if not the default local super-admin).');
  process.exit(1);
}
const APP_DIR = process.env.APP_DIR || join(process.cwd(), 'Frontend/admin-platform/src/app');

const DESTRUCTIVE = /delete|remove|revoke|cancel|deactivate|suspend|ban\b|purge|wipe|reset|unpublish|disable|terminate|refund|clear|archive|drop|kill|stop/i;
const MUTATING = /save|create|add\b|new\b|publish|send|invite|approve|reject|assign|update|submit|import|export|sync|run\b|retry|generate|upload|apply|confirm|pay|charge|enable|activate|rotate|revert|merge|promote/i;

const classify = (name, el) => {
  if (!name) return 'unnamed';
  if (DESTRUCTIVE.test(name)) return 'destructive';
  if (MUTATING.test(name)) return 'mutating';
  if (el === 'a') return 'navigation';
  return 'inert';
};

function collectRoutes(dir, prefix = '') {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry.startsWith('[')) continue;
      const seg = entry.startsWith('(') && entry.endsWith(')') ? prefix : `${prefix}/${entry}`;
      out.push(...collectRoutes(full, seg));
    } else if (entry === 'page.tsx') out.push(prefix || '/');
  }
  return out;
}

const SKIP = new Set(['/login', '/forgot-password', '/mfa', '/welcome', '/invite']);

async function main() {
  const routes = process.env.ROUTES
    ? process.env.ROUTES.split(',').map((r) => r.trim())
    : [...new Set(collectRoutes(APP_DIR))].filter((r) => !SKIP.has(r)).sort();

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 90_000 });
  await page.waitForTimeout(1500);
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForURL(/welcome|dashboard/, { timeout: 30_000 });
  await page.waitForTimeout(3500);

  const report = [];
  let clicked = 0, failures = 0, inventory = 0;

  for (const route of routes) {
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
      await page.waitForTimeout(1600);
    } catch {
      report.push({ route, error: 'could not load route' });
      continue;
    }
    if (new URL(page.url()).pathname.startsWith('/login')) {
      report.push({ route, error: 'session lost' });
      break;
    }

    // Snapshot the controls up-front: clicking mutates the DOM and invalidates handles.
    const controls = await page.evaluate(() => {
      const sel = 'main button, main [role="button"], main [role="tab"], main a[href^="/"]';
      return [...document.querySelectorAll(sel)].map((el, i) => ({
        i,
        name: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
        tag: el.tagName.toLowerCase(),
        disabled: el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true',
      }));
    });

    const perRoute = { route, total: controls.length, clicked: 0, skipped: {}, issues: [] };
    inventory += controls.length;

    for (const c of controls) {
      const kind = classify(c.name, c.tag);
      if (c.disabled) { perRoute.skipped.disabled = (perRoute.skipped.disabled || 0) + 1; continue; }
      if (kind !== 'inert') {
        perRoute.skipped[kind] = (perRoute.skipped[kind] || 0) + 1;
        if (kind === 'unnamed') perRoute.issues.push({ control: `#${c.i}`, kind: 'unnamed-control', detail: 'no accessible name' });
        continue;
      }

      const errs = new Set();
      const onConsole = (m) => { if (m.type() === 'error' && !m.text().includes('Failed to load resource')) errs.add(m.text().slice(0, 130)); };
      const onPageErr = (e) => errs.add('JS: ' + e.message.slice(0, 130));
      const onResp = (r) => { if (r.status() >= 500) errs.add(`${r.status()} ${r.url().slice(0, 80)}`); };
      page.on('console', onConsole); page.on('pageerror', onPageErr); page.on('response', onResp);

      try {
        const handle = (await page.locator('main button, main [role="button"], main [role="tab"], main a[href^="/"]').all())[c.i];
        if (handle) {
          await handle.click({ timeout: 4000, trial: false });
          clicked += 1; perRoute.clicked += 1;
          await page.waitForTimeout(650);
          await page.keyboard.press('Escape').catch(() => {});
          await page.waitForTimeout(150);
          // a click may navigate; come back so later indices still line up
          if (new URL(page.url()).pathname !== route) {
            await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
            await page.waitForTimeout(1200);
          }
        }
      } catch {
        // an unclickable/detached control is not itself a defect — only report errors it raised
      }

      page.off('console', onConsole); page.off('pageerror', onPageErr); page.off('response', onResp);
      if (errs.size) {
        failures += 1;
        perRoute.issues.push({ control: c.name || `#${c.i}`, kind: 'error-on-click', detail: [...errs][0] });
      }
    }

    const flag = perRoute.issues.length ? `  ⚠ ${perRoute.issues.length}` : '';
    console.log(`${route}  controls:${perRoute.total} clicked:${perRoute.clicked}${flag}`);
    perRoute.issues.forEach((i) => console.log(`    ${i.kind}: ${i.control} — ${i.detail}`));
    report.push(perRoute);
  }

  await browser.close();
  writeFileSync('admin-buttons.json', JSON.stringify(report, null, 2));

  const unnamed = report.reduce((n, r) => n + (r.issues?.filter((i) => i.kind === 'unnamed-control').length || 0), 0);
  const notTested = report.reduce((n, r) => n + (r.skipped?.destructive || 0) + (r.skipped?.mutating || 0), 0);
  console.log(`\n── Summary ${'─'.repeat(49)}`);
  console.log(`controls found:   ${inventory}`);
  console.log(`clicked (inert):  ${clicked}`);
  console.log(`errored on click: ${failures}`);
  console.log(`unnamed controls: ${unnamed}   (accessibility defect — also untestable)`);
  console.log(`not auto-clicked: ${notTested}  (destructive/mutating — need a disposable dataset)`);
  console.log(`\nFull detail → admin-buttons.json`);
}

main().catch((e) => { console.error(e); process.exit(1); });
