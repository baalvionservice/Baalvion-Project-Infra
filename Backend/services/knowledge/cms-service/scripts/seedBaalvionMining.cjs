'use strict';
/**
 * Seeds the "Baalvion Mining" (mining.baalvion.com) Trade Insights blog into the
 * central CMS via the live cms-service API, then publishes everything so it is
 * served by the public delivery API (/api/v1/public/baalvion-mining/content).
 *
 * This migrates the Mining frontend's former hardcoded blog posts into real,
 * centrally-managed CMS content editable from the admin-platform console.
 *
 * Idempotent: re-reads existing categories/content, creates only what's missing,
 * and publishes anything still in draft/approved.
 *
 *   node scripts/seedBaalvionMining.cjs
 */
const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS  = process.env.CMS_URL  || 'http://localhost:3018/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW    = process.env.SUPERADMIN_PASSWORD || 'Sup3rAdmin!2026';

const WEBSITE_ID = process.env.MINING_WEBSITE_ID || 'e8a8c652-005f-4592-9ab0-671a2eb624bc';
const BASE = `${CMS}/cms/websites/${WEBSITE_ID}`;

const CATEGORIES = [
  { name: 'Market Analysis', slug: 'market-analysis' },
  { name: 'Technology', slug: 'technology' },
  { name: 'Operations', slug: 'operations' },
];

const blk = (i, type, content) => ({ id: `blk-${i}`, type, order: i, content });
const head = (i, text) => blk(i, 'heading', { text, level: 2 });
const para = (i, text) => blk(i, 'paragraph', { text });

// contentType 'news' so the frontend's cmsGetPosts({ contentType: 'news' }) picks them up.
const POSTS = [
  {
    title: 'The Rise of Critical Minerals in 2024', slug: 'the-rise-of-critical-minerals-in-2024', cat: 'market-analysis',
    excerpt: 'Why lithium, cobalt, and rare earths are reshaping global supply chains.',
    featuredImage: 'https://picsum.photos/seed/mining-critical-minerals/1200/600',
    cf: { category: 'Market Analysis', author: 'Dr. Sarah Chen', readTime: '5 min read', date: 'May 12, 2024' },
    blocks: [
      head(0, 'The New Strategic Commodities'),
      para(1, 'The energy transition has turned a handful of once-obscure minerals into the most strategically contested commodities on earth. Lithium, cobalt, nickel, and the rare-earth group now sit at the center of industrial policy from Washington to Brussels to Beijing.'),
      head(2, 'Demand Outlook'),
      para(3, 'Battery-grade demand is projected to outpace new supply through the rest of the decade, keeping high-purity concentrates structurally tight and rewarding producers who can guarantee grade consistency.'),
      head(4, 'What Exporters Should Do'),
      para(5, 'Lock in long-term offtake agreements, invest in automated compliance verification to reduce port-side delays, and diversify logistics corridors to hedge against single-route disruption.'),
    ],
    seo: { title: 'The Rise of Critical Minerals in 2024 | Baalvion Mining', description: 'Why lithium, cobalt, and rare earths are reshaping global supply chains.' },
  },
  {
    title: 'AI in Mining: Beyond the Hype', slug: 'ai-in-mining-beyond-the-hype', cat: 'technology',
    excerpt: 'Where machine learning is genuinely moving the needle in mineral extraction.',
    featuredImage: 'https://picsum.photos/seed/mining-ai/1200/600',
    cf: { category: 'Technology', author: 'Marc Holden', readTime: '6 min read', date: 'May 10, 2024' },
    blocks: [
      para(0, 'Every mining vendor now claims an AI story. Stripped of the marketing, a few applications are delivering measurable returns today.'),
      head(1, 'Ore-Body Modelling'),
      para(2, 'Machine-learning models trained on drill-core and geophysical data are improving resource estimates and cutting the number of confirmatory holes needed before a development decision.'),
      head(3, 'Predictive Maintenance'),
      para(4, 'Vibration and thermal telemetry feeding anomaly-detection models is reducing unplanned haul-truck and crusher downtime — often the single largest controllable cost on site.'),
      head(5, 'Compliance Automation'),
      para(6, 'Document-extraction models are automating customs and certificate-of-origin checks, shrinking clearing latency across cross-border trade corridors.'),
    ],
    seo: { title: 'AI in Mining: Beyond the Hype | Baalvion Mining', description: 'Where machine learning is genuinely moving the needle in mineral extraction.' },
  },
  {
    title: 'Navigating Cross-Border Logistics', slug: 'navigating-cross-border-logistics', cat: 'operations',
    excerpt: 'A practical guide to customs, compliance, and clearing for mineral exporters.',
    featuredImage: 'https://picsum.photos/seed/mining-logistics/1200/600',
    cf: { category: 'Operations', author: 'James Miller', readTime: '4 min read', date: 'May 05, 2024' },
    blocks: [
      para(0, 'For bulk mineral exporters, the margin is often won or lost not at the mine but at the border. Here is how the best operators keep cargo moving.'),
      head(1, 'Documentation Discipline'),
      para(2, 'Certificate of origin, assay certificates, and hazardous-material declarations should be generated from a single source of truth to avoid the mismatches that trigger inspections.'),
      head(3, 'Corridor Redundancy'),
      para(4, 'Pre-qualify at least two port-of-exit and one inland-rail option for every major route so a single closure does not strand inventory.'),
    ],
    seo: { title: 'Navigating Cross-Border Logistics | Baalvion Mining', description: 'A practical guide to customs, compliance, and clearing for mineral exporters.' },
  },
  {
    title: 'Digital Transformation in Global Mining Operations', slug: 'digital-transformation-in-global-mining-operations', cat: 'technology',
    excerpt: 'How automated compliance and real-time tracking are reducing trade friction.',
    featuredImage: 'https://picsum.photos/seed/mining-digital/1200/600',
    cf: { category: 'Technology', author: 'Priya Nair', readTime: '5 min read', date: 'May 18, 2024' },
    blocks: [
      para(0, 'The most successful mining trade desks have quietly rebuilt their operations around a single connected data layer rather than a patchwork of spreadsheets and email.'),
      head(1, 'Real-Time Cargo Visibility'),
      para(2, 'Live shipment tracking tied to settlement milestones lets finance, compliance, and logistics act on the same picture, cutting reconciliation work and disputes.'),
      head(3, 'Automated Compliance'),
      para(4, 'Rule engines that screen counterparties and route documents for the correct jurisdiction reduce manual review and the risk of costly holds.'),
    ],
    seo: { title: 'Digital Transformation in Global Mining Operations | Baalvion Mining', description: 'How automated compliance and real-time tracking are reducing trade friction.' },
  },
  {
    title: 'Rare-Earth Supply-Chain Resilience', slug: 'rare-earth-supply-chain-resilience', cat: 'market-analysis',
    excerpt: 'Diversifying processing capacity is now a board-level priority, not a sourcing detail.',
    featuredImage: 'https://picsum.photos/seed/mining-rare-earth/1200/600',
    cf: { category: 'Market Analysis', author: 'Dr. Sarah Chen', readTime: '7 min read', date: 'May 22, 2024' },
    blocks: [
      para(0, 'Concentration of rare-earth processing in a single geography has moved supply-chain resilience from a sourcing detail to a board-level risk.'),
      head(1, 'The Processing Bottleneck'),
      para(2, 'Mining rare earths is comparatively widespread; separating and refining them is not. The chokepoint is metallurgical capacity, and it is being actively re-shored.'),
      head(3, 'Building Optionality'),
      para(4, 'Forward-looking buyers are funding alternative separation capacity and signing multi-year agreements to underwrite it, trading a small cost premium for security of supply.'),
    ],
    seo: { title: 'Rare-Earth Supply-Chain Resilience | Baalvion Mining', description: 'Diversifying processing capacity is now a board-level priority.' },
  },
];

// ── HTTP helpers ──
async function req(method, url, token, body) {
  const r = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}
const jget = (url, token) => req('GET', url, token);
const jpost = (url, token, body) => req('POST', url, token, body);

async function login() {
  const res = await jpost(`${AUTH}/login`, null, { email: EMAIL, password: PW });
  const token = res.data?.data?.accessToken;
  if (!token) throw new Error('login failed: ' + JSON.stringify(res.data).slice(0, 240));
  return token;
}

async function fetchCategories(token) {
  const res = await jget(`${BASE}/categories?limit=500`, token);
  const rows = res.data?.data || [];
  const map = {};
  for (const c of rows) map[c.slug] = c.id;
  return map;
}

async function ensureCategories(token) {
  let map = await fetchCategories(token);
  let created = 0, skipped = 0;
  for (const c of CATEGORIES) {
    if (map[c.slug]) { skipped++; continue; }
    const res = await jpost(`${BASE}/categories`, token, { name: c.name, slug: c.slug });
    if (res.status === 201 || res.status === 200) { map[c.slug] = res.data?.data?.id; created++; }
    else if (res.status === 409) { skipped++; }
    else console.error(`  cat ${c.slug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 200));
  }
  map = await fetchCategories(token);
  return { map, created, skipped };
}

async function fetchContent(token) {
  const map = {};
  for (let page = 1; page <= 20; page++) {
    const res = await jget(`${BASE}/content?limit=100&page=${page}`, token);
    const rows = res.data?.data || [];
    for (const c of rows) map[c.slug] = { id: c.id, status: c.status };
    const p = res.data?.pagination;
    if (!p || page >= p.totalPages) break;
  }
  return map;
}

async function ensureContent(token, catMap) {
  const existing = await fetchContent(token);
  let created = 0, skipped = 0;
  const touched = [];
  for (const it of POSTS) {
    touched.push(it.slug);
    if (existing[it.slug]) { skipped++; continue; }
    const payload = {
      title: it.title, slug: it.slug, contentType: 'news',
      excerpt: it.excerpt,
      featuredImage: it.featuredImage,
      categoryId: catMap[it.cat] || undefined,
      contentBlocks: it.blocks,
      customFields: it.cf,
      seoMetadata: it.seo || { title: it.title, description: it.excerpt },
    };
    const res = await jpost(`${BASE}/content`, token, payload);
    if (res.status === 201 || res.status === 200) created++;
    else if (res.status === 409) skipped++;
    else console.error(`  content ${it.slug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 240));
  }
  return { created, skipped, touched };
}

async function publishAll(token, slugs) {
  const map = await fetchContent(token);
  let published = 0, already = 0, failed = 0;
  for (const slug of slugs) {
    const rec = map[slug];
    if (!rec) { failed++; console.error(`  publish ${slug} -> not found`); continue; }
    if (!['draft', 'approved'].includes(rec.status)) { already++; continue; }
    const res = await jpost(`${BASE}/content/${rec.id}/workflow/transition`, token, { action: 'publish' });
    if (res.status === 200 || res.status === 201) published++;
    else { failed++; console.error(`  publish ${slug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 200)); }
  }
  return { published, already, failed };
}

async function main() {
  const token = await login();
  const cats = await ensureCategories(token);
  const content = await ensureContent(token, cats.map);
  const pub = await publishAll(token, content.touched);

  console.log(JSON.stringify({
    ok: true,
    website: WEBSITE_ID,
    categories: { created: cats.created, skipped: cats.skipped, total: Object.keys(cats.map).length },
    content: { created: content.created, skipped: content.skipped, touched: content.touched.length },
    publish: pub,
  }, null, 2));
}

main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
