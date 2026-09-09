'use strict';
/**
 * Seeds the EDITORIAL content for Baalvion Investor Relations (ir.baalvion.com)
 * into the central CMS, then publishes it. Structured investor data (capital calls,
 * NAV history, votes, distributions) intentionally stays in its own backend — only
 * editorial content (press releases, news, reports/docs) is centrally managed here.
 *
 * Idempotent: skips existing (409). Publish is handled separately by
 * scripts/publishWebsite.cjs baalvion-ir (or the central console).
 *
 *   node scripts/seedBaalvionIr.cjs
 */
const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS  = process.env.CMS_URL  || 'http://localhost:3018/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW    = process.env.SUPERADMIN_PASSWORD;

const WEBSITE_ID = process.env.IR_WEBSITE_ID || '7bced69e-a861-4530-9660-e0ddb955d72b';
const BASE = `${CMS}/cms/websites/${WEBSITE_ID}`;

const CATEGORIES = [
  { name: 'Press Releases', slug: 'press-releases' },
  { name: 'Earnings Reports', slug: 'earnings-reports' },
  { name: 'News', slug: 'news' },
];

const blk = (i, type, content) => ({ id: `blk-${i}`, type, order: i, content });
const para = (i, text) => blk(i, 'paragraph', { text });

/**
 * PRESS and NEWS are empty, and must stay empty until there is something real.
 *
 * Seven fabricated items were seeded from here into the production CMS and served
 * publicly on ir.baalvion.com. They were modelled on BlackRock's investor relations
 * releases, and several named real people and real figures:
 *
 *   - "Baalvion's Martin S. Small to Present at the 2026 Bank of America Securities
 *     Financial Services Conference" — Martin S. Small is BlackRock's CFO.
 *   - "Baalvion Elects Gregg Lemkau to Board of Directors" — Gregg Lemkau is a real
 *     person and has never been a director of this company.
 *   - "Full Year 2025 Diluted EPS of $35.31, or $48.09 as adjusted" — an invented
 *     earnings disclosure for a private company incorporated on 2025-03-11, using
 *     figures in the shape of BlackRock's own reported results.
 *   - An acquisition ("VeriTrade"), a partnership ("PortLink Logistics"), a Davos
 *     appearance by a founder named "Alexandros Vasilias" who does not exist, and
 *     "150% YoY Growth in Platform Transaction Volume".
 *
 * Invented earnings figures and board appointments on an investor relations site are
 * representations to investors, not placeholder copy. Nothing goes in these arrays that
 * did not actually happen, and no entry may name a person who has not agreed to appear.
 *
 * To purge what was already published, run scripts/purgeBaalvionIrFiction.cjs.
 */
const PRESS = [];
const NEWS = [];

async function req(method, url, token, body) {
  const r = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

async function fetchCategories(token) {
  const res = await req('GET', `${BASE}/categories?limit=200`, token);
  const map = {};
  for (const c of res.data?.data || []) map[c.slug] = c.id;
  return map;
}

async function main() {
  const login = await req('POST', `${AUTH}/login`, null, { email: EMAIL, password: PW });
  const token = login.data?.data?.accessToken;
  if (!token) throw new Error('login failed: ' + JSON.stringify(login.data).slice(0, 200));

  let catMap = await fetchCategories(token);
  let cats = 0;
  for (const c of CATEGORIES) {
    if (catMap[c.slug]) continue;
    const res = await req('POST', `${BASE}/categories`, token, { name: c.name, slug: c.slug });
    if (res.status === 201 || res.status === 200) cats++;
    else if (res.status !== 409) console.error(`cat ${c.slug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 160));
  }
  catMap = await fetchCategories(token);

  let created = 0, skipped = 0;
  for (const it of [...PRESS, ...NEWS]) {
    const payload = {
      title: it.title, slug: it.slug, contentType: 'news', excerpt: it.excerpt,
      categoryId: catMap[it.cat] || undefined,
      contentBlocks: it.blocks || [],
      customFields: it.cf || {},
      seoMetadata: { title: it.title.slice(0, 200), description: (it.excerpt || '').slice(0, 300) },
    };
    const res = await req('POST', `${BASE}/content`, token, payload);
    if (res.status === 201 || res.status === 200) created++;
    else if (res.status === 409) skipped++;
    else console.error(`content ${it.slug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 200));
  }

  console.log(JSON.stringify({ ok: true, website: WEBSITE_ID, categories: cats, content: { created, skipped } }, null, 2));
}
main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
