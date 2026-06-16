'use strict';
/**
 * Seeds the Amarisé Maison Avenue EDITORIAL/static content into the central CMS
 * (website slug `amarise-maison-avenue`) via the live cms-service API, then publishes
 * everything so it is served by the public delivery API
 *   /api/v1/public/amarise-maison-avenue/content/...
 *
 * This migrates the storefront's former in-memory editorial mock (src/lib/mock-data.ts:
 * MAISON_STORY, CUSTOMER_SERVICE, CITIES, BUYING_GUIDES, editorials) into real,
 * centrally-managed CMS content, editable from the admin-platform console.
 *
 * Contract matches Frontend/AmariseMaisonAvenue-main/src/lib/cms.ts:
 *   - maison-story      page  customFields = { title, subtitle, philosophy, history[],
 *                                              craftsmanship[], sustainability, institutionalCharter }
 *   - customer-service  page  customFields = { byCountry: { us|uk|ae|in|sg|ca: {shipping, returns, faqs[]} } }
 *   - privacy-policy    page  contentBlocks (heading/paragraph)
 *   - terms-of-service  page  contentBlocks
 *   - city pages        post  kind 'city'         customFields = { name, countryCode, description, heroImage, trends[], featuredCollections[], featuredProducts[] }
 *   - buying guides     post  kind 'buying-guide' customFields = { category, author, date, tips[], investmentOutlook, targetKeyword }
 *   - editorials        news  kind 'editorial'    customFields = { category, author, date, targetKeyword }
 *
 * Idempotent: re-reads existing content, creates only what's missing, publishes drafts.
 *
 *   CMS_URL=http://localhost:3011/api/v1 node scripts/seedAmariseEditorial.cjs
 */
const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS  = process.env.CMS_URL  || 'http://localhost:3011/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW    = process.env.SUPERADMIN_PASSWORD;

const WEBSITE_ID = process.env.AMARISE_WEBSITE_ID || 'f5649580-30b0-4335-aff1-9e3ee2b5c6fc';
const BASE = `${CMS}/cms/websites/${WEBSITE_ID}`;

const blk = (i, type, content) => ({ id: `blk-${i}`, type, order: i, content });
const para = (i, text) => blk(i, 'paragraph', { text });
const head = (i, text) => blk(i, 'heading', { text, level: 2 });

// ── Category tree ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Maison', slug: 'maison' },
  { name: 'Client Services', slug: 'client-services' },
  { name: 'Legal', slug: 'legal' },
  { name: 'City Edits', slug: 'city-edits' },
  { name: 'Buying Guides', slug: 'buying-guides' },
  { name: 'Journal', slug: 'journal' },
  { name: 'Artisanal', slug: 'journal-artisanal', parent: 'journal' },
  { name: 'Seasonal', slug: 'journal-seasonal', parent: 'journal' },
  { name: 'City Edit', slug: 'journal-city-edit', parent: 'journal' },
  { name: 'VIP Exclusive', slug: 'journal-vip', parent: 'journal' },
];

// ── Maison story (page) ──────────────────────────────────────────────────────
const MAISON_STORY = {
  title: 'A Legacy of Radiance', slug: 'maison-story', cat: 'maison',
  excerpt: 'The heritage, philosophy and craftsmanship of AMARISÉ MAISON, since 1924.',
  seo: { title: 'About AMARISÉ MAISON | Our Heritage Since 1924', description: 'Discover the centuries-old heritage and craftsmanship of AMARISÉ MAISON AVENUE.' },
  cf: {
    kind: 'page',
    title: 'A Legacy of Radiance',
    subtitle: 'Since 1924.',
    philosophy: 'Luxury is human brilliance — the patient, uncompromising pursuit of the absolute in every artifact we curate.',
    history: [
      { year: '1924', milestone: 'The First Atelier', description: 'Founded in Paris on a single conviction: that craft, not scale, defines the absolute.' },
      { year: '1958', milestone: 'The Heritage Line', description: 'The founding archives are formalised into a permanent collection of investment-grade pieces.' },
      { year: '1991', milestone: 'A Global House', description: 'Amarisé opens its first international salons, carrying the Parisian standard across continents.' },
      { year: '2024', milestone: 'The Digital Maison', description: 'A unified global platform brings white-glove curation to collectors in every market.' },
    ],
    craftsmanship: [
      { title: 'Haute Couture', description: 'Hand-sewn in our Parisian ateliers by master artisans across hundreds of disciplined hours.', imageUrl: 'https://picsum.photos/seed/amarise-craft-couture/800/1000' },
      { title: 'High Jewelry', description: 'Each stone is selected, set and certified to provenance standards that outlast generations.', imageUrl: 'https://picsum.photos/seed/amarise-craft-jewelry/800/1000' },
      { title: 'Leather Mastery', description: 'Exotic and heritage leathers worked by hand, every stitch a signature of the maker.', imageUrl: 'https://picsum.photos/seed/amarise-craft-leather/800/1000' },
    ],
    sustainability: 'We preserve the earth as we preserve our craft — sourcing responsibly, producing deliberately, and building artifacts meant to be inherited, never discarded.',
    institutionalCharter: 'Our mission is to maintain the standard of the absolute in every artifact we curate.',
  },
  blocks: [ head(0, 'A Legacy of Radiance'), para(1, 'AMARISÉ MAISON began in Paris in 1924 with a single conviction: that craft, not scale, defines the absolute.') ],
};

// ── Customer service (page; per-country in customFields.byCountry) ───────────
const FAQ_VIEWING = { question: 'How can I book a private viewing?', answer: 'Contact our concierge team to arrange a private viewing at our nearest atelier.' };
const FAQ_INTL = { question: 'Do you offer international shipping?', answer: 'Yes, we provide white-glove shipping worldwide with full insurance coverage.' };
const FAQ_AUTH = { question: 'What is your authenticity guarantee?', answer: 'Every piece undergoes rigorous verification by our master curators.' };
const FAQ_CANCEL = { question: 'Can I cancel my order?', answer: 'Orders can be cancelled before dispatch. Once shipped, the return policy applies.' };
const FAQ_DAMAGE = { question: 'What if my item arrives damaged?', answer: 'Contact us within 48 hours with photos for immediate support.' };
const FAQ_DUTIES = { question: 'What about customs and duties?', answer: 'Any applicable duties or taxes are clearly communicated at checkout with no hidden charges after purchase.' };

const RETURN_STD = '30-day return policy with free shipping and full authenticity verification.';
const RETURN_INTL = 'We accept returns for both defective and non-defective products within 30 days of delivery. Items must be unused and in original condition with original packaging, tags, and seals intact. Returns accepted by mail only with free return shipping provided. Refunds processed within 5–7 business days after inspection and approval.';

const CUSTOMER_SERVICE = {
  title: 'Customer Service', slug: 'customer-service', cat: 'client-services',
  excerpt: 'Shipping, returns and frequently asked questions for every market.',
  seo: { title: 'Customer Service | AMARISÉ MAISON', description: 'White-glove shipping, returns and concierge support across all markets.' },
  cf: {
    kind: 'page',
    byCountry: {
      us: { shipping: 'White-glove delivery within the United States through our premium logistics network.', returns: RETURN_STD, faqs: [{ ...FAQ_VIEWING, answer: 'Contact our concierge team to arrange a private viewing at our New York atelier.' }, FAQ_INTL, FAQ_AUTH] },
      uk: { shipping: 'White-glove delivery within the United Kingdom through our premium logistics network.', returns: RETURN_STD, faqs: [{ ...FAQ_VIEWING, answer: 'Contact our concierge team to arrange a private viewing at our London atelier.' }, FAQ_INTL, FAQ_AUTH] },
      ae: { shipping: 'All UAE orders are fulfilled from our international ateliers and delivered via trusted global logistics partners. Order Processing: 1–2 business days. Transit Time: 3–7 business days. Free standard shipping across the United Arab Emirates with full insurance coverage.', returns: RETURN_INTL, faqs: [FAQ_VIEWING, FAQ_CANCEL, FAQ_DAMAGE, FAQ_DUTIES] },
      in: { shipping: 'White-glove delivery within India through our premium logistics network.', returns: RETURN_STD, faqs: [{ ...FAQ_VIEWING, answer: 'Contact our concierge team to arrange a private viewing at our Mumbai atelier.' }, FAQ_INTL, FAQ_AUTH] },
      sg: { shipping: 'All Singapore orders are fulfilled from our international ateliers and delivered via trusted global logistics partners. International Transit: 4–8 business days. Free standard shipping on all orders to Singapore with full insurance coverage.', returns: RETURN_INTL, faqs: [FAQ_VIEWING, FAQ_CANCEL, FAQ_DAMAGE, FAQ_DUTIES] },
      ca: { shipping: 'All Canadian orders are fulfilled from our international ateliers and shipped through trusted global logistics partners. International Transit: 5–10 business days. Free standard shipping on all orders to Canada with full insurance coverage.', returns: RETURN_INTL, faqs: [FAQ_VIEWING, FAQ_CANCEL, FAQ_DAMAGE, FAQ_DUTIES] },
    },
  },
  blocks: [ head(0, 'Customer Service'), para(1, 'Every Amarisé order is accompanied by white-glove logistics, full insurance and concierge support.') ],
};

// ── Legal pages (page; contentBlocks) ────────────────────────────────────────
const LEGAL = [
  { title: 'Privacy Policy', slug: 'privacy-policy', cat: 'legal',
    excerpt: 'How AMARISÉ MAISON collects, uses and protects your information.',
    seo: { title: 'Privacy Policy | AMARISÉ MAISON', description: 'Our privacy practices and your data rights.' },
    cf: { kind: 'page' },
    blocks: [ head(0, 'Privacy Policy'),
      para(1, 'This policy explains how AMARISÉ MAISON collects, uses, secures and shares information across our global platform.'),
      head(2, 'Information We Collect'),
      para(3, 'We collect only the information required to fulfil your orders, provide concierge services and meet our regulatory obligations.'),
      head(4, 'How We Use It'),
      para(5, 'Your information is used to process acquisitions, arrange white-glove delivery, verify authenticity and personalise your experience. We never sell your data.'),
      head(6, 'Your Rights'),
      para(7, 'You may request access to, correction of, or deletion of your personal data at any time by contacting our concierge team.') ] },
  { title: 'Terms of Service', slug: 'terms-of-service', cat: 'legal',
    excerpt: 'The terms governing use of the AMARISÉ MAISON platform.',
    seo: { title: 'Terms of Service | AMARISÉ MAISON', description: 'Terms governing use of the AMARISÉ MAISON platform.' },
    cf: { kind: 'page' },
    blocks: [ head(0, 'Terms of Service'),
      para(1, 'By accessing the AMARISÉ MAISON platform you agree to these terms.'),
      head(2, 'Acquisitions'),
      para(3, 'All acquisitions are subject to authenticity verification and availability. Prices are presented in your market currency inclusive of applicable taxes where required.'),
      head(4, 'Authenticity Guarantee'),
      para(5, 'Every artifact is verified by our master curators and accompanied by a certificate of provenance.'),
      head(6, 'Acceptable Use'),
      para(7, 'Use of the platform must comply with applicable law and the obligations set out here.') ] },
];

// ── Membership plans (page; customFields.plans[]) ────────────────────────────
const MEMBERSHIP_PLANS = {
  title: 'Membership Plans', slug: 'membership-plans', cat: 'client-services',
  excerpt: 'The private client tiers of AMARISÉ MAISON.',
  seo: { title: 'Membership Plans | AMARISÉ MAISON', description: 'Private client membership tiers — Silver, Gold and Diamond.' },
  cf: {
    kind: 'page',
    plans: [
      { id: 'plan-silver', name: 'Silver Member', price: 500, currency: 'USD', interval: 'yearly', tier: 'Silver',
        features: ['Curatorial Access', 'Standard Shipping', 'Digital Provenance'] },
      { id: 'plan-gold', name: 'Maison Gold', price: 2500, currency: 'USD', interval: 'yearly', tier: 'Gold', isPopular: true,
        features: ['Priority Viewings', 'White-Glove Dispatch', 'Annual Heritage Report'] },
      { id: 'plan-diamond', name: 'Atelier Diamond', price: 10000, currency: 'USD', interval: 'yearly', tier: 'Diamond',
        features: ['Private Salon Keys', 'Investment Advisory', 'Bespoke Sourcing', 'Unlimited Live Ateliers'] },
    ],
  },
  blocks: [ head(0, 'Membership Plans'), para(1, 'Membership in the Maison is an architectural commitment to human brilliance and the preservation of heritage.') ],
};

// ── City edits (post; kind 'city') ───────────────────────────────────────────
const CITIES = [
  { title: 'New York', slug: 'new-york', cat: 'city-edits', excerpt: 'The global pulse.',
    featuredImage: 'https://picsum.photos/seed/ny-luxe/1920/1080',
    cf: { kind: 'city', name: 'New York', countryCode: 'us', description: 'The global pulse.', heroImage: 'https://picsum.photos/seed/ny-luxe/1920/1080',
      featuredCollections: ['heritage'], featuredProducts: [],
      trends: [{ title: 'Fifth Ave Minimalism', description: 'Monochrome tailoring.' }] } },
  { title: 'London', slug: 'london', cat: 'city-edits', excerpt: 'The heritage soul.',
    featuredImage: 'https://picsum.photos/seed/ldn-luxe/1920/1080',
    cf: { kind: 'city', name: 'London', countryCode: 'uk', description: 'The heritage soul.', heroImage: 'https://picsum.photos/seed/ldn-luxe/1920/1080',
      featuredCollections: ['spring-24'], featuredProducts: [],
      trends: [{ title: 'Bond Street Classic', description: 'Traditional bespoke.' }] } },
  { title: 'Dubai', slug: 'dubai', cat: 'city-edits', excerpt: 'The desert oasis of gold.',
    featuredImage: 'https://picsum.photos/seed/dxb-luxe/1920/1080',
    cf: { kind: 'city', name: 'Dubai', countryCode: 'ae', description: 'The desert oasis of gold.', heroImage: 'https://picsum.photos/seed/dxb-luxe/1920/1080',
      featuredCollections: ['prive'], featuredProducts: [],
      trends: [{ title: 'Desert Opulence', description: 'High jewelry focus.' }] } },
];

// ── Buying guides (post; kind 'buying-guide') ────────────────────────────────
const GUIDES = [
  { title: 'The Collector’s Guide to the Hermès Birkin', slug: 'guide-hermes-birkin', cat: 'buying-guides',
    excerpt: 'How to identify, value and acquire the most coveted handbag in the world.',
    featuredImage: 'https://picsum.photos/seed/amarise-guide-birkin/1200/800',
    cf: { kind: 'buying-guide', category: 'Artisanal', author: 'Elena Vance', date: '2024-03-10',
      targetKeyword: 'hermes birkin buying guide', investmentOutlook: 'Steady 12–15% annual appreciation observed over the last decade for pristine examples.',
      tips: ['Verify the blind-stamp date code and the artisan’s mark.', 'Understand leather grades — Togo, Clemence and exotic skins carry different value trajectories.', 'Prioritise hardware condition and corner wear over age alone.'] },
    blocks: [ para(0, 'The Birkin is not merely a handbag; it is a portable asset class. Acquiring one of magnitude requires intelligence as much as means.'),
      para(1, 'Provenance, materiality and condition determine value. A pristine 25cm in a rare leather can outperform far larger pieces.') ] },
  { title: 'Understanding High Jewelry Provenance', slug: 'guide-high-jewelry-provenance', cat: 'buying-guides',
    excerpt: 'A masterclass in certification, origin and the long-term value of fine stones.',
    featuredImage: 'https://picsum.photos/seed/amarise-guide-jewelry/1200/800',
    cf: { kind: 'buying-guide', category: 'Artisanal', author: 'Elena Vance', date: '2024-03-12',
      targetKeyword: 'high jewelry provenance guide', investmentOutlook: 'Certified, untreated stones with documented origin command durable premiums at auction.',
      tips: ['Insist on independent certification (GIA, SSEF, Gübelin) for any significant stone.', 'Documented origin materially affects value for sapphires, rubies and emeralds.', 'Treatments must be disclosed — untreated stones are rarer and more valuable.'] },
    blocks: [ para(0, 'In high jewelry, the certificate is as important as the stone. Provenance transforms a beautiful object into an investment.'),
      para(1, 'The senior curators at Amarisé evaluate every piece against origin, treatment and craftsmanship before it is offered.') ] },
  { title: 'The Art of Acquiring a Heritage Timepiece', slug: 'guide-heritage-timepiece', cat: 'buying-guides',
    excerpt: 'What separates a watch from a horological investment.',
    featuredImage: 'https://picsum.photos/seed/amarise-guide-watch/1200/800',
    cf: { kind: 'buying-guide', category: 'Artisanal', author: 'Marcus Aurelius', date: '2024-03-14',
      targetKeyword: 'luxury watch investment guide', investmentOutlook: 'Complicated, limited-production references from established houses hold value best.',
      tips: ['Originality of dial, hands and movement is paramount — service parts erode value.', 'Box, papers and service history complete the provenance.', 'Complications and limited production drive long-term desirability.'] },
    blocks: [ para(0, 'A heritage timepiece is measured in generations, not seasons. Originality is the single greatest determinant of value.'),
      para(1, 'Full box, papers and an unbroken service history can add materially to a reference’s worth.') ] },
];

// ── Editorials / journal (news; kind 'editorial') ────────────────────────────
const EDITORIALS = [
  { title: 'The Architecture of Time', slug: 'ed-architecture-of-time', cat: 'journal-artisanal',
    excerpt: 'An exploration of horological investment within the global Maison context.',
    featuredImage: 'https://picsum.photos/seed/amarise-ed-time/1200/800',
    cf: { kind: 'editorial', category: 'Artisanal', author: 'Elena Vance', date: '2024-03-01', targetKeyword: 'luxury watch investment' },
    seo: { title: 'The Architecture of Time | AMARISÉ Journal', description: 'Discover the expert perspective on luxury watch investment at Maison Amarisé.' },
    blocks: [ para(0, 'In the heart of our ateliers, the pursuit of horological perfection remains a dialogue between human brilliance and timeless heritage.'),
      para(1, 'The standard of the absolute is never compromised — every complication earns its place.') ] },
  { title: 'Haute Couture: A Human Dialogue', slug: 'ed-haute-couture-dialogue', cat: 'journal-seasonal',
    excerpt: 'Bespoke couture as a conversation between maker and wearer.',
    featuredImage: 'https://picsum.photos/seed/amarise-ed-couture/1200/800',
    cf: { kind: 'editorial', category: 'Seasonal', author: 'Elena Vance', date: '2024-03-04', targetKeyword: 'bespoke couture trends' },
    seo: { title: 'Haute Couture: A Human Dialogue | AMARISÉ Journal', description: 'Bespoke couture trends from the senior curators at Maison Amarisé.' },
    blocks: [ para(0, 'Couture is the slowest of luxuries — measured in fittings, not in minutes.'),
      para(1, 'Each garment is a record of the hours and the hands that made it.') ] },
  { title: 'The Soul of Silk', slug: 'ed-soul-of-silk', cat: 'journal-artisanal',
    excerpt: 'Heritage silk craft and the archives that preserve it.',
    featuredImage: 'https://picsum.photos/seed/amarise-ed-silk/1200/800',
    cf: { kind: 'editorial', category: 'Artisanal', author: 'Elena Vance', date: '2024-03-07', targetKeyword: 'heritage silk craft' },
    seo: { title: 'The Soul of Silk | AMARISÉ Journal', description: 'Heritage silk craft at Maison Amarisé.' },
    blocks: [ para(0, 'Hand-painted archives carry the memory of every artisan who touched them.'),
      para(1, 'Silk is the maison’s quietest material and its most expressive.') ] },
  { title: 'Opaque Brilliance: Diamonds of the Future', slug: 'ed-opaque-brilliance', cat: 'journal-artisanal',
    excerpt: 'On rare diamond collecting and the long horizon of value.',
    featuredImage: 'https://picsum.photos/seed/amarise-ed-diamond/1200/800',
    cf: { kind: 'editorial', category: 'Artisanal', author: 'Elena Vance', date: '2024-03-10', targetKeyword: 'rare diamond collecting' },
    seo: { title: 'Opaque Brilliance | AMARISÉ Journal', description: 'Rare diamond collecting at Maison Amarisé.' },
    blocks: [ para(0, 'The rarest stones are bought not for a season but for a lineage.'),
      para(1, 'Certification and provenance turn brilliance into permanence.') ] },
  { title: 'Atelier Secrets: Bond Street', slug: 'ed-atelier-bond-street', cat: 'journal-city-edit',
    excerpt: 'A city edit of London’s most discreet luxury addresses.',
    featuredImage: 'https://picsum.photos/seed/amarise-ed-bond/1200/800',
    cf: { kind: 'editorial', category: 'City Edit', author: 'Elena Vance', date: '2024-03-13', targetKeyword: 'London luxury shopping guide' },
    seo: { title: 'Atelier Secrets: Bond Street | AMARISÉ Journal', description: 'A London luxury shopping guide from Maison Amarisé.' },
    blocks: [ para(0, 'Bond Street keeps its finest rooms behind unmarked doors.'),
      para(1, 'The Amarisé salon continues that tradition of considered discretion.') ] },
  { title: 'The Midnight Collection Narrative', slug: 'ed-midnight-collection', cat: 'journal-vip',
    excerpt: 'An exclusive look at a limited edition reserved for our patrons.',
    featuredImage: 'https://picsum.photos/seed/amarise-ed-midnight/1200/800',
    cf: { kind: 'editorial', category: 'VIP Exclusive', author: 'Elena Vance', date: '2024-03-16', targetKeyword: 'limited edition luxury apparel' },
    seo: { title: 'The Midnight Collection | AMARISÉ Journal', description: 'A limited edition luxury narrative reserved for Amarisé patrons.' },
    blocks: [ para(0, 'The Midnight Collection exists in the smallest of numbers, offered first to those closest to the house.'),
      para(1, 'Scarcity here is not a tactic; it is the nature of the work.') ] },
];

// ── HTTP helpers ─────────────────────────────────────────────────────────────
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
  for (const pass of [0, 1]) {
    for (const c of CATEGORIES) {
      const isChild = !!c.parent;
      if ((pass === 0) === isChild) continue;
      if (map[c.slug]) { skipped++; continue; }
      const payload = { name: c.name, slug: c.slug };
      if (c.parent) payload.parentId = map[c.parent];
      const res = await jpost(`${BASE}/categories`, token, payload);
      if (res.status === 201 || res.status === 200) { map[c.slug] = res.data?.data?.id; created++; }
      else if (res.status === 409) { skipped++; }
      else console.error(`  cat ${c.slug} -> ${res.status}`, JSON.stringify(res.data).slice(0, 200));
    }
    map = await fetchCategories(token);
  }
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

async function ensureContent(token, catMap, items, contentType) {
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
      customFields: it.cf || {},
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

  const pages = await ensureContent(token, cats.map, [MAISON_STORY, CUSTOMER_SERVICE, MEMBERSHIP_PLANS, ...LEGAL], 'page');
  const cities = await ensureContent(token, cats.map, CITIES, 'post');
  const guides = await ensureContent(token, cats.map, GUIDES, 'post');
  const eds = await ensureContent(token, cats.map, EDITORIALS, 'news');

  const allSlugs = [pages, cities, guides, eds].flatMap((r) => r.touched);
  const pub = await publishAll(token, allSlugs);

  console.log(JSON.stringify({
    ok: true,
    website: WEBSITE_ID,
    categories: { created: cats.created, skipped: cats.skipped, total: Object.keys(cats.map).length },
    content: { pages: pages.created, cities: cities.created, guides: guides.created, editorials: eds.created, totalTouched: allSlugs.length },
    publish: pub,
  }, null, 2));
}

main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
