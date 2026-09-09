'use strict';
/**
 * Removes the fabricated Investor Relations content that was published to the CMS and
 * served publicly on ir.baalvion.com.
 *
 * Three groups, all invented:
 *
 *   1. Eleven executives and directors credentialed with other companies' top jobs —
 *      "Chairman and CEO of Verizon Communications Inc.", "Former CFO of Shell plc",
 *      "President and CEO of Rockefeller Capital Management", plus four carrying
 *      BlackRock's own role titles ("Global Head of Aladdin Client Business").
 *   2. Press releases and news naming real people who have no connection to the company
 *      (Martin S. Small, BlackRock's CFO; Gregg Lemkau) and reporting earnings — "Full
 *      Year 2025 Diluted EPS of $35.31" — for a company incorporated on 2025-03-11.
 *   3. An acquisition, a partnership, and a Davos appearance by a founder who does not
 *      exist ("Alexandros Vasilias").
 *
 * The company's real staff are listed in KEEP below and are never touched. Anything not
 * matched by a rule here is also left alone: the script removes only what it can name.
 *
 * Against production, CMS_URL must be the admin BFF, not api.baalvion.com:
 *
 *   CMS_URL=https://admin.baalvion.com/api-bff/knowledge/cms/api/v1
 *
 * api.baalvion.com only proxies /api/v1/public/* to cms-service — the authenticated
 * /cms/websites/* routes are not routed on that host at all, so they answer 404 rather
 * than 401. Caddy terminates /api-bff/knowledge/cms/* at the edge and strips the prefix,
 * so cms-service receives /api/v1/*, which is what this script's paths assume.
 *
 * IR_WEBSITE_ID takes the slug (baalvion-ir); resolveWebsite rewrites it to the UUID.
 *
 * Auth: either a pre-issued access token (preferred) or a superadmin login.
 *   export CMS_ACCESS_TOKEN='eyJ…'      # from the admin console session
 *   export SUPERADMIN_PASSWORD='…'      # fallback
 *
 * Dry run (default — prints what it would delete, changes nothing):
 *   node scripts/purgeBaalvionIrFiction.cjs
 *
 * Apply:
 *   node scripts/purgeBaalvionIrFiction.cjs --apply
 */
const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS = process.env.CMS_URL || 'http://localhost:3018/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW = process.env.SUPERADMIN_PASSWORD;
/**
 * A pre-issued access token, as an alternative to logging in. Preferred: it avoids putting
 * a long-lived password on a command line, and these tokens are short-lived, so a leaked
 * one expires on its own. Grab it from the admin console's session and export it.
 */
const TOKEN = process.env.CMS_ACCESS_TOKEN;
const WEBSITE_ID = process.env.IR_WEBSITE_ID || '7bced69e-a861-4530-9660-e0ddb955d72b';
const BASE = `${CMS}/cms/websites/${WEBSITE_ID}`;
const APPLY = process.argv.includes('--apply');

/** Real Baalvion people. Never deleted, whatever else matches. */
const KEEP = new Set([
  'Deepak Kumar Kuldeep',
  'Tamanna Shaikh',
  'Tamanna shaikh',
  'Dilip Kumar Kuldeep',
  'Adarsh Patra',
  'Parthamesh Pawer',
  'Laxman Singh Champia',
  'Rashmika Singh',
  'Preeti snigdha Mallick',
  'Sasmita Gemel',
  'Vishal Kumar Pingua',
  'Biswajeet Patra',
  'Jaid Alam',
]);

/** Invented people, by exact title. */
const FICTIONAL_PEOPLE = [
  'Jonathan R. Whitfield',
  'Margaret A. Sinclair',
  'David C. Harrington',
  'Catherine E. Lawson',
  'Richard P. Donnelly',
  'Andrew S. Caldwell',
  'Eleanor M. Brooks',
  'Nathan P. Cole',
  'Olivia R. Bennett',
  'Marcus T. Hale',
  'Daniel K. Mercer',
  'Sophia L. Marchetti',
];

/** Invented editorial, by slug where known and by title otherwise. */
const FICTIONAL_SLUGS = [
  'martin-small-bofa-2026',
  'gregg-lemkau-board',
  'fy2025-eps-results',
  'veritrade-acquisition',
  'portlink-partnership',
  'davos-unified-ledger',
  'q2-2024-growth',
];

/** Substrings that identify the remaining invented editorial by title. */
const FICTIONAL_TITLE_MARKERS = [
  'Diluted EPS',
  'Gregg Lemkau',
  'Martin S. Small',
  'Alexandros Vasilias',
  'VeriTrade',
  'PortLink',
  '150% YoY Growth',
  'Strengthens Board with New Independent Director',
  'Annual Report 2025',
  'Q1 2026 Earnings Summary',
  'Q3 Financial Strategy Update',
  'Baalvion Announces Strategic Expansion',
];

/**
 * Real people whose CMS excerpt still carries BlackRock's product name. The person stays;
 * only the borrowed title is corrected.
 */
const TITLE_FIXES = [
  { name: 'Laxman Singh Champia', from: 'Co-Head of Aladdin Product Engineering', to: 'Co-Head of Product Engineering' },
  { name: 'Rashmika Singh',       from: 'Co-Head of Aladdin Product Engineering', to: 'Co-Head of Product Engineering' },
  // The company confirmed the split: Tamanna shaikh is CEO, Adarsh Patra is CTO. Both were
  // published as Chief Executive Officer.
  { name: 'Adarsh Patra',         from: 'Chief Executive Officer',                to: 'Chief Technology Officer' },
];

async function req(method, url, token, body) {
  const r = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

function isFiction(item) {
  const title = (item.title || '').trim();
  if (KEEP.has(title)) return null;
  if (FICTIONAL_PEOPLE.includes(title)) return 'invented person';
  if (item.slug && FICTIONAL_SLUGS.includes(item.slug)) return 'invented press/news';
  const marker = FICTIONAL_TITLE_MARKERS.find((m) => title.includes(m));
  if (marker) return `invented editorial (${marker})`;
  return null;
}

async function resolveToken() {
  if (TOKEN) return TOKEN.replace(/^Bearer\s+/i, '');
  if (!PW) throw new Error('Set CMS_ACCESS_TOKEN (preferred) or SUPERADMIN_PASSWORD');
  const login = await req('POST', `${AUTH}/login`, null, { email: EMAIL, password: PW });
  const t = login.data?.data?.accessToken;
  if (!t) throw new Error('login failed: ' + JSON.stringify(login.data).slice(0, 200));
  return t;
}

async function main() {
  const token = await resolveToken();

  const res = await req('GET', `${BASE}/content?limit=500`, token);
  const items = res.data?.data || [];
  if (!items.length) throw new Error(`no content returned (status ${res.status})`);

  const doomed = [];
  for (const it of items) {
    const why = isFiction(it);
    if (why) doomed.push({ ...it, why });
  }

  console.log(`${items.length} items in the IR website; ${doomed.length} identified as fabricated.\n`);
  for (const d of doomed) console.log(`  ${d.why.padEnd(34)} ${d.title}`);

  const kept = items.filter((i) => KEEP.has((i.title || '').trim()));
  console.log(`\n  ${kept.length} real people preserved: ${kept.map((k) => k.title).join(', ')}`);

  const fixable = TITLE_FIXES.filter((f) => {
    const i = items.find((x) => (x.title || '').trim() === f.name);
    return i && (i.excerpt || '').includes(f.from);
  });
  if (fixable.length) {
    console.log(`\n  ${fixable.length} borrowed title(s) to correct:`);
    for (const f of fixable) console.log(`    ${f.name}: "${f.from}" -> "${f.to}"`);
  }

  if (!APPLY) {
    console.log('\nDry run. Re-run with --apply to delete and correct the items listed above.');
    return;
  }

  let gone = 0;
  for (const d of doomed) {
    const r = await req('DELETE', `${BASE}/content/${d.id}`, token);
    if (r.status === 200 || r.status === 204) gone++;
    else console.error(`  failed ${d.title} -> ${r.status} ${JSON.stringify(r.data).slice(0, 120)}`);
  }

  let fixed = 0;
  for (const fix of TITLE_FIXES) {
    const item = items.find((i) => (i.title || '').trim() === fix.name);
    if (!item || !(item.excerpt || '').includes(fix.from)) continue;
    const r = await req('PATCH', `${BASE}/content/${item.id}`, token, {
      excerpt: item.excerpt.replace(fix.from, fix.to),
    });
    if (r.status === 200) fixed++;
    else console.error(`  title fix failed ${fix.name} -> ${r.status}`);
  }

  console.log(`\nDeleted ${gone}/${doomed.length}; corrected ${fixed} borrowed title(s).`);
  console.log('Republish the site so the public pages refresh.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
