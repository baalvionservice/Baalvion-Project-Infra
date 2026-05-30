'use strict';
/**
 * Seeds real categories + content for the first 3 CMS sites
 * (imperialpedia.com, ir.baalvion.com, about.baalvion.com) via the live cms-service API,
 * so it exercises the real create → revision → workflow path. Idempotent: skips 409s.
 *
 *   node scripts/seedContent.cjs
 */
const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS  = process.env.CMS_URL  || 'http://localhost:3018/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW    = process.env.SUPERADMIN_PASSWORD || 'Sup3rAdmin!2026';

const SITES = {
  imperialpedia: {
    id: 'f963f97f-e03f-4383-bac3-d8849e9a7c71',
    categories: [
      { name: 'History', slug: 'history' },
      { name: 'Technology', slug: 'technology' },
      { name: 'Geography', slug: 'geography' },
    ],
    content: [
      { title: 'The Baalvion Empire', slug: 'the-baalvion-empire', contentType: 'article', cat: 'history',
        excerpt: 'A comprehensive overview of the Baalvion Empire, its origins, and global reach.',
        blocks: [ ['heading','Origins'], ['paragraph','The Baalvion Empire emerged as a federated network of digital and physical enterprises spanning commerce, media, mining, and law.'], ['paragraph','Its governance model is built on a centralized identity and a multi-tenant operating system.'] ] },
      { title: 'Quantum Computing Overview', slug: 'quantum-computing-overview', contentType: 'article', cat: 'technology',
        excerpt: 'An introduction to quantum computing principles and their industrial applications.',
        blocks: [ ['heading','What is Quantum Computing?'], ['paragraph','Quantum computing leverages superposition and entanglement to perform computations intractable for classical machines.'] ] },
      { title: 'Global Trade Routes', slug: 'global-trade-routes', contentType: 'article', cat: 'geography',
        excerpt: 'Mapping the major arteries of modern global commerce.',
        blocks: [ ['heading','Maritime Corridors'], ['paragraph','The bulk of global trade still flows through a handful of strategic maritime chokepoints.'] ] },
    ],
  },
  'baalvion-ir': {
    id: '7bced69e-a861-4530-9660-e0ddb955d72b',
    categories: [
      { name: 'Earnings Reports', slug: 'earnings-reports' },
      { name: 'Press Releases', slug: 'press-releases' },
    ],
    content: [
      { title: 'Q1 2026 Earnings Summary', slug: 'q1-2026-earnings-summary', contentType: 'news', cat: 'earnings-reports',
        excerpt: 'Baalvion Group reports strong first-quarter results across all segments.',
        blocks: [ ['heading','Financial Highlights'], ['paragraph','Revenue grew 24% year-over-year, driven by the commerce and infrastructure segments.'] ] },
      { title: 'Annual Report 2025', slug: 'annual-report-2025', contentType: 'doc', cat: 'earnings-reports',
        excerpt: 'The complete Baalvion Group annual report for fiscal year 2025.',
        blocks: [ ['heading','Letter to Shareholders'], ['paragraph','2025 was a transformative year as we unified our platform under a single operating system.'] ] },
      { title: 'Baalvion Announces Strategic Expansion', slug: 'strategic-expansion-announcement', contentType: 'news', cat: 'press-releases',
        excerpt: 'The Group announces expansion into new markets and verticals.',
        blocks: [ ['paragraph','Baalvion Group today announced a strategic expansion of its multi-tenant platform to serve enterprise customers globally.'] ] },
    ],
  },
  'about-baalvion': {
    id: 'cf2d3583-7247-48a6-9fd2-0959043c7a8b',
    categories: [
      { name: 'Company', slug: 'company' },
      { name: 'People', slug: 'people' },
    ],
    content: [
      { title: 'Our Story', slug: 'our-story', contentType: 'page', cat: 'company',
        excerpt: 'How Baalvion grew from an idea into a global federated enterprise.',
        blocks: [ ['heading','From Vision to Platform'], ['paragraph','Baalvion began with a simple conviction: that one shared operating system could power an entire ecosystem of businesses.'] ] },
      { title: 'Leadership', slug: 'leadership', contentType: 'page', cat: 'people',
        excerpt: 'Meet the people steering the Baalvion Group.',
        blocks: [ ['heading','Executive Team'], ['paragraph','Our leadership brings together decades of experience across technology, finance, and operations.'] ] },
      { title: 'Careers at Baalvion', slug: 'careers-at-baalvion', contentType: 'page', cat: 'company',
        excerpt: 'Build the future of multi-tenant infrastructure with us.',
        blocks: [ ['paragraph','We are always looking for exceptional engineers, designers, and operators to join the mission.'] ] },
    ],
  },
};

const block = (type, text, i) => ({ id: `blk-${i}`, type, order: i, content: type === 'heading' ? { text, level: 2 } : { text } });

async function jpost(url, token, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}

async function main() {
  const login = await jpost(`${AUTH}/login`, null, { email: EMAIL, password: PW });
  const token = login.data?.data?.accessToken;
  if (!token) throw new Error('login failed: ' + JSON.stringify(login.data).slice(0, 200));

  const summary = {};
  for (const [slug, site] of Object.entries(SITES)) {
    const base = `${CMS}/cms/websites/${site.id}`;
    const catIds = {};
    let cats = 0, items = 0, skipped = 0;

    for (const c of site.categories) {
      const res = await jpost(`${base}/categories`, token, c);
      if (res.status === 201 || res.status === 200) { catIds[c.slug] = res.data?.data?.id; cats++; }
      else if (res.status === 409) { skipped++; }
      else console.error(`  cat ${c.slug} → ${res.status}`, JSON.stringify(res.data).slice(0, 160));
    }

    for (const item of site.content) {
      const payload = {
        title: item.title, slug: item.slug, contentType: item.contentType, excerpt: item.excerpt,
        contentBlocks: item.blocks.map(([t, txt], i) => block(t, txt, i)),
        categoryId: catIds[item.cat] || undefined,
        seoMetadata: { title: item.title, description: item.excerpt },
      };
      const res = await jpost(`${base}/content`, token, payload);
      if (res.status === 201 || res.status === 200) items++;
      else if (res.status === 409) skipped++;
      else console.error(`  content ${item.slug} → ${res.status}`, JSON.stringify(res.data).slice(0, 200));
    }
    summary[slug] = { categories: cats, content: items, skipped };
  }
  console.log(JSON.stringify({ ok: true, summary }, null, 2));
}
main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
