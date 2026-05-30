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
const PW    = process.env.SUPERADMIN_PASSWORD || 'Sup3rAdmin!2026';

const WEBSITE_ID = process.env.IR_WEBSITE_ID || '7bced69e-a861-4530-9660-e0ddb955d72b';
const BASE = `${CMS}/cms/websites/${WEBSITE_ID}`;

const CATEGORIES = [
  { name: 'Press Releases', slug: 'press-releases' },
  { name: 'Earnings Reports', slug: 'earnings-reports' },
  { name: 'News', slug: 'news' },
];

const blk = (i, type, content) => ({ id: `blk-${i}`, type, order: i, content });
const para = (i, text) => blk(i, 'paragraph', { text });

// Press releases (contentType news, kind=press-release)
const PRESS = [
  { title: "Baalvion's Martin S. Small to Present at the 2026 Bank of America Securities Financial Services Conference on February 10th",
    slug: 'martin-small-bofa-2026', cat: 'press-releases',
    excerpt: 'Baalvion will present at the 2026 Bank of America Securities Financial Services Conference.',
    cf: { kind: 'press-release', date: 'Feb 02, 2026', link: '#' },
    blocks: [ para(0, 'Baalvion today announced that Martin S. Small will present at the 2026 Bank of America Securities Financial Services Conference on February 10th.') ] },
  { title: 'Baalvion Elects Gregg Lemkau to Board of Directors',
    slug: 'gregg-lemkau-board', cat: 'press-releases',
    excerpt: 'Baalvion has elected Gregg Lemkau to its Board of Directors.',
    cf: { kind: 'press-release', date: 'Jan 27, 2026', link: '#' },
    blocks: [ para(0, 'Baalvion today announced the election of Gregg Lemkau to its Board of Directors, effective immediately.') ] },
  { title: 'Baalvion Reports Full Year 2025 Diluted EPS of $35.31, or $48.09 as adjusted; Fourth Quarter 2025 Diluted EPS of $7.16, or $13.16 as adjusted',
    slug: 'fy2025-eps-results', cat: 'earnings-reports',
    excerpt: 'Baalvion reports full year and fourth quarter 2025 financial results.',
    cf: { kind: 'press-release', date: 'Jan 15, 2026', link: '#', download: '#', webcast: '#', supplement: '#' },
    blocks: [ para(0, 'Baalvion today reported full year 2025 diluted EPS of $35.31, or $48.09 as adjusted, and fourth quarter 2025 diluted EPS of $7.16, or $13.16 as adjusted.') ] },
];

// News articles (contentType news, kind=news-article)
const NEWS = [
  { title: "Baalvion Acquires FinTech 'VeriTrade' to Automate Trade Finance Compliance",
    slug: 'veritrade-acquisition', cat: 'news',
    excerpt: "The acquisition integrates VeriTrade's AI-powered AML and KYC technology directly into the Baalvion OS, reducing transaction friction and enhancing security for all platform participants. This move is central to our strategy of owning the complete compliance stack.",
    cf: { kind: 'news-article', date: '2024-07-15', imageId: 'news-1-image' } },
  { title: "Strategic Partnership with 'PortLink Logistics' to Digitize Global Shipping Routes",
    slug: 'portlink-partnership', cat: 'news',
    excerpt: "This collaboration will onboard PortLink's extensive network of carriers and port operators onto the Baalvion platform, creating unprecedented visibility and efficiency in maritime logistics. We anticipate a 30% reduction in processing times for shared clients.",
    cf: { kind: 'news-article', date: '2024-06-28', imageId: 'news-2-image' } },
  { title: "Founder Alexandros Vasilias Details Vision for a 'Unified Ledger for Global Trade' at Davos",
    slug: 'davos-unified-ledger', cat: 'news',
    excerpt: "Speaking at the World Economic Forum, Mr. Vasilias outlined Baalvion's long-term vision to create a single, immutable source of truth for B2B transactions, aiming to unlock trillions in liquidity and eliminate fraud.",
    cf: { kind: 'news-article', date: '2024-06-10', imageId: 'news-3-image' } },
  { title: 'Baalvion Reports 150% YoY Growth in Platform Transaction Volume for Q2 2024',
    slug: 'q2-2024-growth', cat: 'news',
    excerpt: 'The company has exceeded all financial projections, citing strong enterprise adoption of its integrated trade OS and the successful rollout of its automated customs clearance module in key APAC markets.',
    cf: { kind: 'news-article', date: '2024-07-20', imageId: 'news-1-image' } },
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
