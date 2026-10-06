#!/usr/bin/env node
/**
 * @file scripts/live-smoke.mjs
 * @description Read-only smoke test of a REAL login against a running GTI site.
 *
 * Signs in with the account you give it, asks who the platform thinks you are, then sends a
 * list of read-only GET requests through the same-origin proxies the app uses and reports
 * which backends answer. It never writes data, and it never prints your password, cookies
 * or tokens.
 *
 *   GTI_EMAIL=you@example.com GTI_PASSWORD='...' node scripts/live-smoke.mjs
 *   GTI_BASE=http://localhost:9013 ...                (default: https://trade.baalvion.com)
 *
 * Reading the result:
 *   200/204   the backend answered with data
 *   401       the session was rejected (login did not stick)
 *   403       your role may not use this area (normal for some roles)
 *   404       the route or the backend behind it is missing
 *   5xx       the backend is down or crashed
 */
const BASE = (process.env.GTI_BASE || 'https://trade.baalvion.com').replace(/\/$/, '');
const EMAIL = process.env.GTI_EMAIL;
const PASSWORD = process.env.GTI_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error('Set GTI_EMAIL and GTI_PASSWORD in the environment (not on the command line, so they stay out of shell history).');
  process.exit(2);
}

const jar = new Map();
function remember(res) {
  for (const line of res.headers.getSetCookie?.() ?? []) {
    const [pair] = line.split(';');
    const i = pair.indexOf('=');
    if (i > 0) jar.set(pair.slice(0, i).trim(), pair.slice(i + 1).trim());
  }
}
const cookieHeader = () => [...jar].map(([k, v]) => `${k}=${v}`).join('; ');

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    redirect: 'manual',
    headers: { 'content-type': 'application/json', ...(jar.size ? { cookie: cookieHeader() } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  remember(res);
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { status: res.status, json, text };
}

const code = (r) => r.json?.error?.code || (typeof r.json?.error === 'string' ? r.json.error.slice(0, 40) : '') || '';

// Read-only GETs only. Grouped by the backend each one depends on.
const CHECKS = [
  ['trade service', ['/trade-bff/shipments', '/trade-bff/orders', '/trade-bff/listings', '/trade-bff/rfqs', '/trade-bff/deals', '/trade-bff/escrows', '/trade-bff/tradeops/shipments']],
  ['finance service', ['/finance-bff/trade-finance', '/finance-bff/wallets', '/finance-bff/accounts', '/finance-bff/ledger', '/finance-bff/credit', '/finance-bff/fx']],
];

const login = await call('POST', '/trade-bff/auth/login', { email: EMAIL, password: PASSWORD });
console.log(`login            HTTP ${login.status}${login.status === 200 ? '' : '  ' + code(login)}`);
if (login.json?.mfaRequired || login.json?.data?.mfaRequired) {
  console.log('This account needs a second factor. Use an account without MFA for this test.');
  process.exit(3);
}
if (login.status !== 200) process.exit(1);

const me = await call('GET', '/trade-bff/auth/me');
const u = me.json?.user ?? me.json?.data?.user ?? {};
console.log(`who am i         HTTP ${me.status}  role=${(u.roles || []).join(',') || '?'}  orgType=${u.orgType ?? '?'}`);
if (me.status !== 200) {
  console.log('The login was accepted but the session did not stick (cookies not kept). Stopping.');
  process.exit(1);
}

const tally = { ok: 0, forbidden: 0, missing: 0, down: 0, other: 0 };
for (const [label, paths] of CHECKS) {
  console.log(`\n${label}`);
  for (const p of paths) {
    const r = await call('GET', p);
    const s = r.status;
    if (s >= 200 && s < 300) tally.ok += 1;
    else if (s === 403) tally.forbidden += 1;
    else if (s === 404) tally.missing += 1;
    else if (s >= 500) tally.down += 1;
    else tally.other += 1;
    console.log(`  ${p.padEnd(34)} HTTP ${s}  ${code(r)}`);
  }
}
console.log(`\nanswered with data: ${tally.ok}   role not allowed (403): ${tally.forbidden}   missing (404): ${tally.missing}   backend down (5xx): ${tally.down}   other: ${tally.other}`);
await call('POST', '/trade-bff/auth/logout');
