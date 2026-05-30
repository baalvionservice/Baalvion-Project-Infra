'use strict';
/**
 * Seeds the FULL "About Baalvion" website (about.baalvion.com) into the central CMS
 * via the live cms-service API, then publishes everything so it is served by the
 * public delivery API (/api/v1/public/about-baalvion/...).
 *
 * This migrates the frontend's former in-memory mock (src/lib/db.ts) into real,
 * centrally-managed CMS content so it can be edited from the admin-platform console:
 *   - Category tree (Projects / News / Operational Updates / Ecosystem / Company)
 *     with nested sub-categories.
 *   - Pages (page-builder sections carried in customFields.sections)
 *   - Projects        (contentType portfolio_item, customFields.kind = 'project')
 *   - News articles   (contentType news,           customFields.kind = 'article')
 *   - Operational updates (contentType post,        customFields.kind = 'operational-update')
 *   - Ecosystem layers    (contentType post,        customFields.kind = 'ecosystem')
 *
 * Idempotent: re-reads existing categories/content, creates only what's missing,
 * and publishes anything still in draft/approved.
 *
 *   node scripts/seedAboutBaalvion.cjs
 */
const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS  = process.env.CMS_URL  || 'http://localhost:3018/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW    = process.env.SUPERADMIN_PASSWORD || 'Sup3rAdmin!2026';

const WEBSITE_ID = process.env.ABOUT_WEBSITE_ID || 'cf2d3583-7247-48a6-9fd2-0959043c7a8b';
const BASE = `${CMS}/cms/websites/${WEBSITE_ID}`;

// ── Category tree (slugs unique per website; sub-categories reference parent slug) ──
const CATEGORIES = [
  { name: 'Company', slug: 'company' },
  { name: 'People', slug: 'people' },

  { name: 'Projects', slug: 'projects' },
  { name: 'Core Platform',    slug: 'proj-core-platform',    parent: 'projects' },
  { name: 'Industrial',       slug: 'proj-industrial',       parent: 'projects' },
  { name: 'Internal Systems', slug: 'proj-internal-systems', parent: 'projects' },
  { name: 'Intelligence',     slug: 'proj-intelligence',     parent: 'projects' },
  { name: 'Governance',       slug: 'proj-governance',       parent: 'projects' },
  { name: 'Commerce',         slug: 'proj-commerce',         parent: 'projects' },

  { name: 'News', slug: 'news' },
  { name: 'Company News', slug: 'news-company', parent: 'news' },
  { name: 'Daily Updates', slug: 'news-updates', parent: 'news' },

  { name: 'Operational Updates', slug: 'operational-updates' },
  { name: 'Finance',         slug: 'ops-finance',         parent: 'operational-updates' },
  { name: 'Banking',         slug: 'ops-banking',         parent: 'operational-updates' },
  { name: 'Platform',        slug: 'ops-platform',        parent: 'operational-updates' },
  { name: 'System',          slug: 'ops-system',          parent: 'operational-updates' },
  { name: 'Legal',           slug: 'ops-legal',           parent: 'operational-updates' },
  { name: 'Partner',         slug: 'ops-partner',         parent: 'operational-updates' },
  { name: 'Payment Gateway', slug: 'ops-payment-gateway', parent: 'operational-updates' },
  { name: 'HR',              slug: 'ops-hr',              parent: 'operational-updates' },
  { name: 'Other',           slug: 'ops-other',           parent: 'operational-updates' },

  { name: 'Ecosystem', slug: 'ecosystem' },
  { name: 'Infrastructure', slug: 'eco-infrastructure', parent: 'ecosystem' },
  { name: 'Intelligence',   slug: 'eco-intelligence',   parent: 'ecosystem' },
  { name: 'Governance',     slug: 'eco-governance',     parent: 'ecosystem' },
  { name: 'Commerce',       slug: 'eco-commerce',       parent: 'ecosystem' },
  { name: 'Finance',        slug: 'eco-finance',        parent: 'ecosystem' },
];

const blk = (i, type, content) => ({ id: `blk-${i}`, type, order: i, content });
const para = (i, text) => blk(i, 'paragraph', { text });
const head = (i, text) => blk(i, 'heading', { text, level: 2 });
const html = (i, h) => blk(i, 'html', { html: h });

// ── Pages (page-builder; sections carried verbatim in customFields.sections) ──
const PAGES = [
  {
    title: 'Baalvion — Global Trade Infrastructure Platform', slug: 'home', cat: 'company',
    excerpt: 'The unified operating system for international commerce, finance, and compliance.',
    seo: { title: 'Baalvion Operating System (BOS) | Global Trade Infrastructure', description: 'The unified operating system for international commerce, finance, and compliance.' },
    sections: [
      { id: 'sec-hero-home', type: 'hero', title: 'Operating the Global Trade Infrastructure',
        description: 'Connecting businesses, finance, compliance, and logistics across 198 countries — all through a single unified system.',
        data: { ctaPrimary: 'Explore Our Platform', ctaSecondary: 'Partner With Us', label: 'Baalvion Operating System (BOS)',
          stats: [ { label: 'Markets', value: '198' }, { label: 'Active Partners', value: '125+' }, { label: 'Transactions', value: '500K+' } ] } },
      { id: 'sec-problem-home', type: 'problem', title: 'The Terminal Fragmentation of Trade',
        description: 'Legacy commerce systems are siloed, inefficient, and slow. Global trade requires a unified execution layer.',
        data: { points: [ { title: 'Siloed Data', desc: 'Information is locked in disparate systems across jurisdictions.' },
          { title: 'Clearing Latency', desc: 'Manual compliance and banking checks slow down value movement.' },
          { title: 'Scaling Friction', desc: 'Businesses struggle to integrate across modular market layers.' } ] } },
      { id: 'sec-solution-home', type: 'solution', title: 'A Unified Protocol for Global Value',
        description: 'The Baalvion Operating System (BOS) orchestrates every node of international commerce into one transparent ledger.',
        data: { features: [ { title: 'Real-Time Clearing', desc: 'Automated settlement protocols for cross-border finance.' },
          { title: 'AI Scoring', desc: 'Intelligent compliance mapping for 180+ countries.' },
          { title: 'Node Scalability', desc: 'Modular architecture allowing seamless partner integration.' } ] } },
      { id: 'sec-cta-home', type: 'cta-final', title: 'Join the Future of Infrastructure',
        description: 'Connect your business to the most advanced trade operating system in the world.',
        data: { ctaPrimary: 'Get Started', ctaSecondary: 'Contact Strategy Team' } },
    ],
  },
  {
    title: 'Baalvion Platform | How It Works', slug: 'platform', cat: 'company',
    excerpt: 'Explore the modular layers of the Baalvion Operating System.',
    seo: { title: 'How It Works | Baalvion Platform Architecture', description: 'Explore the modular layers of the Baalvion Operating System.' },
    sections: [
      { id: 'sec-platform-features', type: 'features', title: 'A Modular Operating System',
        description: 'Every layer of the Baalvion Operating System is independently scalable and composable.',
        data: { features: [
          { title: 'Identity & Access', desc: 'A single canonical identity across every Baalvion property.' },
          { title: 'Commerce Layer', desc: 'Marketplaces, payments, and settlement in one ledger.' },
          { title: 'Compliance Engine', desc: 'AI-driven risk scoring for 180+ jurisdictions.' },
          { title: 'Logistics Mesh', desc: 'Real-time tracking and clearing across trade corridors.' },
        ] } },
    ],
  },
];

// ── Company pages (already seeded as drafts; included so they get published) ──
const COMPANY_PAGES = [
  { title: 'Our Story', slug: 'our-story', cat: 'company',
    excerpt: 'How Baalvion grew from an idea into a global federated enterprise.',
    blocks: [ head(0, 'From Vision to Platform'), para(1, 'Baalvion began with a simple conviction: that one shared operating system could power an entire ecosystem of businesses.') ] },
  { title: 'Leadership', slug: 'leadership', cat: 'people',
    excerpt: 'Meet the people steering the Baalvion Group.',
    blocks: [ head(0, 'Executive Team'), para(1, 'Our leadership brings together decades of experience across technology, finance, and operations.') ] },
  { title: 'Careers at Baalvion', slug: 'careers-at-baalvion', cat: 'company',
    excerpt: 'Build the future of multi-tenant infrastructure with us.',
    blocks: [ para(0, 'We are always looking for exceptional engineers, designers, and operators to join the mission.') ] },
];

// ── Projects (portfolio_item) ──
const PROJECTS = [
  { title: 'Baalvion Trade Platform', slug: 'baalvion-trade-platform', cat: 'proj-core-platform',
    excerpt: 'Global trade infrastructure connecting businesses, finance, and compliance.',
    cf: { category: 'Core Platform', type: 'SaaS', status: 'In Development', domain: 'baalvionstack.com', isFeatured: true, priority: 1,
      longDescription: 'The primary SaaS infrastructure for international commerce connectivity, unifying finance, compliance and logistics.' },
    seo: { title: 'Global Trade Platform | Baalvion Operating System', description: 'The primary SaaS infrastructure for international commerce connectivity.' } },
  { title: 'Mining Operations Dashboard', slug: 'mining-operations-dashboard', cat: 'proj-industrial',
    excerpt: 'Real-time monitoring and management for high-scale mining initiatives.',
    cf: { category: 'Industrial', type: 'Industrial Tool', status: 'Active', domain: 'mining.baalvion.com', isFeatured: true, priority: 2 } },
  { title: 'Employee Monitoring App', slug: 'employee-monitoring-app', cat: 'proj-internal-systems',
    excerpt: 'Track and optimize internal team productivity and node performance.',
    cf: { category: 'Internal Systems', type: 'Internal Tool', status: 'Active', domain: 'app.baalvionstack.com', isFeatured: true, priority: 3 } },
  { title: 'AI Market Intelligence', slug: 'ai-market-intelligence', cat: 'proj-intelligence',
    excerpt: 'AI-driven research, analytics, and live market insights across the ecosystem.',
    cf: { category: 'Intelligence', type: 'AI Platform', status: 'In Development', domain: 'intel.baalvion.com', isFeatured: false, priority: 4 } },
  { title: 'Governance & Compliance Suite', slug: 'governance-compliance-suite', cat: 'proj-governance',
    excerpt: 'Compliance, legal frameworks, and corporate policy tooling for global operations.',
    cf: { category: 'Governance', type: 'Governance Tool', status: 'Active', domain: 'gov.baalvion.com', isFeatured: false, priority: 5 } },
  { title: 'Luxury Commerce Network', slug: 'luxury-commerce-network', cat: 'proj-commerce',
    excerpt: 'Verified luxury brands and high-end trade operations on the Baalvion ledger.',
    cf: { category: 'Commerce', type: 'Marketplace', status: 'Planned', domain: 'amarise.baalvion.com', isFeatured: false, priority: 6 } },
];

// ── News articles (news) ──
const NEWS = [
  { title: 'What you need to know about Baalvion today: March 24, 2026', slug: 'today', cat: 'news-updates',
    excerpt: 'Latest headlines from the Baalvion Operating System expansion and global trade corridors.',
    featuredImage: 'https://picsum.photos/seed/news1/600/400',
    cf: { category: 'updates', author: 'Baalvion Staff', readTime: '2 min read', date: 'March 24, 2026', isTrending: true },
    blocks: [ para(0, 'Baalvion is accelerating the deployment of the Baalvion Operating System (BOS) across multiple global nodes.'),
      para(1, 'Recent expansions in the Middle East trade corridors have demonstrated a 40% reduction in clearing latency for mid-market partners. Additionally, our satellite production facility has reached a new milestone, with production capacity now at 30 units per week.'),
      para(2, 'In the UK, the AI compliance scoring system has officially launched, providing real-time risk assessment for cross-border transactions.') ],
    seo: { title: 'Daily Update: March 24, 2026 | Baalvion News', description: 'Latest headlines from the Baalvion Operating System expansion and global trade corridors.' } },
  { title: 'Baalvion Group Unifies Platform Under a Single Operating System', slug: 'platform-unification', cat: 'news-company',
    excerpt: 'A landmark consolidation brings every Baalvion property onto one identity and one ledger.',
    featuredImage: 'https://picsum.photos/seed/news2/600/400',
    cf: { category: 'company', author: 'Communications', readTime: '3 min read', date: 'April 2, 2026', isTrending: false },
    blocks: [ head(0, 'One Platform, Many Businesses'), para(1, 'Baalvion Group has completed the migration of its commerce, media, mining and legal properties onto a single multi-tenant operating system.') ],
    seo: { title: 'Platform Unification | Baalvion News', description: 'Every Baalvion property now runs on one identity and one ledger.' } },
];

// ── Operational updates (post) ──
const UPDATES = [
  { title: 'SBI Corporate Account Integration', slug: 'sbi-corporate-account-integration', cat: 'ops-banking',
    excerpt: 'Integrated the State Bank of India corporate API for real-time automated clearing on the Indian BOS node.',
    cf: { kind: 'operational-update', updateId: 'U001', date: '2026-03-20', category: 'Banking', responsiblePerson: 'Finance Team / Dev Ops',
      reference: 'https://sbi.co.in/corporate', status: 'Completed', impactLevel: 'High',
      followUpActions: 'Monitor transaction latency for the first 48 hours.', tags: ['banking', 'india', 'automation'] },
    blocks: [ para(0, 'Successfully integrated the State Bank of India corporate API for real-time automated clearing across the Indian Baalvion Operating System (BOS) node.') ] },
  { title: 'AI Compliance Scoring — UK Launch', slug: 'ai-compliance-scoring-uk-launch', cat: 'ops-platform',
    excerpt: 'Real-time cross-border risk assessment is now live for the UK trade corridor.',
    cf: { kind: 'operational-update', updateId: 'U002', date: '2026-03-24', category: 'Platform', responsiblePerson: 'Compliance Engineering',
      status: 'Completed', impactLevel: 'High', followUpActions: 'Expand coverage to the EU corridor in Q2.', tags: ['compliance', 'ai', 'uk'] },
    blocks: [ para(0, 'The AI compliance scoring system is now live in the UK, providing real-time risk assessment for cross-border transactions.') ] },
  { title: 'Payment Gateway Failover Hardening', slug: 'payment-gateway-failover-hardening', cat: 'ops-payment-gateway',
    excerpt: 'Added multi-provider failover to the payments layer to eliminate single-provider downtime.',
    cf: { kind: 'operational-update', updateId: 'U003', date: '2026-04-05', category: 'Payment Gateway', responsiblePerson: 'Payments Platform',
      status: 'In Progress', impactLevel: 'Medium', tags: ['payments', 'reliability'] },
    blocks: [ para(0, 'Rolling out automatic multi-provider failover so that a single gateway outage no longer interrupts settlement.') ] },
];

// ── Ecosystem layers (post) ──
const ECOSYSTEM = [
  { title: 'Infrastructure Layer', slug: 'eco-infrastructure-layer', cat: 'eco-infrastructure',
    excerpt: 'The backbone for global business operations.',
    cf: { kind: 'ecosystem', layer: 'Infrastructure', domain: 'baalvionstack.com' } },
  { title: 'Intelligence Layer', slug: 'eco-intelligence-layer', cat: 'eco-intelligence',
    excerpt: 'AI-driven research, analytics, and market insight across the ecosystem.',
    cf: { kind: 'ecosystem', layer: 'Intelligence', domain: 'intel.baalvion.com' } },
  { title: 'Governance Layer', slug: 'eco-governance-layer', cat: 'eco-governance',
    excerpt: 'Compliance, legal frameworks, and corporate policy for the whole group.',
    cf: { kind: 'ecosystem', layer: 'Governance', domain: 'gov.baalvion.com' } },
  { title: 'Commerce Layer', slug: 'eco-commerce-layer', cat: 'eco-commerce',
    excerpt: 'Marketplaces, luxury brands, and high-end trade operations.',
    cf: { kind: 'ecosystem', layer: 'Commerce', domain: 'market.baalvion.com' } },
  { title: 'Finance Layer', slug: 'eco-finance-layer', cat: 'eco-finance',
    excerpt: 'Banking, settlement, escrow, and the unified Baalvion ledger.',
    cf: { kind: 'ecosystem', layer: 'Finance', domain: 'finance.baalvion.com' } },
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

// Map slug -> id for existing categories
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
  // Two passes so parents exist before children
  for (const pass of [0, 1]) {
    for (const c of CATEGORIES) {
      const isChild = !!c.parent;
      if ((pass === 0) === isChild) continue; // pass 0 = parents, pass 1 = children
      if (map[c.slug]) { skipped++; continue; }
      const payload = { name: c.name, slug: c.slug };
      if (c.parent) payload.parentId = map[c.parent];
      const res = await jpost(`${BASE}/categories`, token, payload);
      if (res.status === 201 || res.status === 200) { map[c.slug] = res.data?.data?.id; created++; }
      else if (res.status === 409) { skipped++; }
      else console.error(`  cat ${c.slug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 200));
    }
    map = await fetchCategories(token); // refresh after each pass
  }
  return { map, created, skipped };
}

// Map slug -> {id, status} for existing content (paginated)
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

async function ensureContent(token, catMap, items, contentType, extraCf = {}) {
  let map = await fetchContent(token);
  let created = 0, skipped = 0;
  const touched = [];
  for (const it of items) {
    touched.push(it.slug);
    if (map[it.slug]) { skipped++; continue; }
    const payload = {
      title: it.title, slug: it.slug, contentType,
      excerpt: it.excerpt,
      categoryId: catMap[it.cat] || undefined,
      contentBlocks: it.blocks || [],
      customFields: { ...extraCf, ...(it.cf || {}), ...(it.sections ? { sections: it.sections } : {}) },
      seoMetadata: it.seo || { title: it.title, description: it.excerpt },
    };
    if (it.featuredImage) payload.featuredImage = it.featuredImage;
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
    if (['published', 'scheduled', 'archived'].includes(rec.status)) { already++; continue; }
    // draft/approved -> publish (changes_requested/pending_review would need other steps)
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

  const pages   = await ensureContent(token, cats.map, PAGES,         'page',           { kind: 'page' });
  const company = await ensureContent(token, cats.map, COMPANY_PAGES, 'page',           { kind: 'page' });
  const proj    = await ensureContent(token, cats.map, PROJECTS,      'portfolio_item', { kind: 'project' });
  const news    = await ensureContent(token, cats.map, NEWS,          'news',           { kind: 'article' });
  const updates = await ensureContent(token, cats.map, UPDATES,       'post',           { kind: 'operational-update' });
  const eco     = await ensureContent(token, cats.map, ECOSYSTEM,     'post',           { kind: 'ecosystem' });

  const allSlugs = [pages, company, proj, news, updates, eco].flatMap((r) => r.touched);
  const pub = await publishAll(token, allSlugs);

  console.log(JSON.stringify({
    ok: true,
    website: WEBSITE_ID,
    categories: { created: cats.created, skipped: cats.skipped, total: Object.keys(cats.map).length },
    content: { pages: pages.created, company: company.created, projects: proj.created, news: news.created, updates: updates.created, ecosystem: eco.created,
               totalTouched: allSlugs.length },
    publish: pub,
  }, null, 2));
}

main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
