'use strict';
/**
 * Seeds the FULL "Law Elite Network" website (law-elite-network) into the central CMS
 * via the live cms-service API, then publishes everything so it is served by the
 * public delivery API (/api/v1/public/law-elite-network/...).
 *
 * This makes every editorial surface of the Law Elite frontend manageable from the
 * admin-platform CMS console (/cms/websites/<lawId>/...):
 *   - Practice-area category tree (6 areas) with their sub-categories (18) — slugs
 *     mirror law-service exactly so the public site can read CMS with no URL change.
 *   - Static / marketing pages   (contentType page,    customFields.kind = 'page')
 *   - Membership plans           (contentType page,    customFields.kind = 'plans')
 *   - Homepage promo blocks       (contentType page,    customFields.kind = 'homepage')
 *   - Legal knowledge articles    (contentType article, customFields.kind = 'article')
 *
 * Idempotent: re-reads existing categories/content, creates only what's missing,
 * and publishes anything still in draft/approved.
 *
 *   CMS_URL=http://localhost:3011/api/v1 node scripts/seedLawElite.cjs
 */
const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS  = process.env.CMS_URL  || 'http://localhost:3011/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW    = process.env.SUPERADMIN_PASSWORD || 'Sup3rAdmin!2026';

const WEBSITE_ID = process.env.LAW_WEBSITE_ID || '99560d59-8370-4d7f-b451-d4a7edab85a8';
const BASE = `${CMS}/cms/websites/${WEBSITE_ID}`;

// ── Practice-area category tree — slugs mirror law-service /v1/categories exactly
//    so a CMS-wired frontend keeps identical /law/<slug> URLs. ──
const CATEGORIES = [
  { name: 'Corporate Law',         slug: 'corporate-law',         cf: { icon: 'Building2' } },
  { name: 'Contracts',  slug: 'corporate-law-contracts',  parent: 'corporate-law' },
  { name: 'Compliance', slug: 'corporate-law-compliance', parent: 'corporate-law' },
  { name: 'M&A',        slug: 'corporate-law-m-a',        parent: 'corporate-law' },

  { name: 'Criminal Law',          slug: 'criminal-law',          cf: { icon: 'Scale' } },
  { name: 'DUI Defense',  slug: 'criminal-law-dui-defense',  parent: 'criminal-law' },
  { name: 'White Collar', slug: 'criminal-law-white-collar', parent: 'criminal-law' },
  { name: 'Appeals',      slug: 'criminal-law-appeals',      parent: 'criminal-law' },

  { name: 'Family Law',            slug: 'family-law',            cf: { icon: 'Users' } },
  { name: 'Divorce',       slug: 'family-law-divorce',       parent: 'family-law' },
  { name: 'Child Custody', slug: 'family-law-child-custody', parent: 'family-law' },
  { name: 'Adoption',      slug: 'family-law-adoption',      parent: 'family-law' },

  { name: 'Immigration Law',       slug: 'immigration-law',       cf: { icon: 'Globe' } },
  { name: 'Visas',       slug: 'immigration-law-visas',       parent: 'immigration-law' },
  { name: 'Asylum',      slug: 'immigration-law-asylum',      parent: 'immigration-law' },
  { name: 'Citizenship', slug: 'immigration-law-citizenship', parent: 'immigration-law' },

  { name: 'Intellectual Property', slug: 'intellectual-property', cf: { icon: 'Lightbulb' } },
  { name: 'Patents',    slug: 'intellectual-property-patents',    parent: 'intellectual-property' },
  { name: 'Trademarks', slug: 'intellectual-property-trademarks', parent: 'intellectual-property' },
  { name: 'Copyright',  slug: 'intellectual-property-copyright',  parent: 'intellectual-property' },

  { name: 'Real Estate Law',       slug: 'real-estate-law',       cf: { icon: 'Home' } },
  { name: 'Leasing',  slug: 'real-estate-law-leasing',  parent: 'real-estate-law' },
  { name: 'Disputes', slug: 'real-estate-law-disputes', parent: 'real-estate-law' },
  { name: 'Closings', slug: 'real-estate-law-closings', parent: 'real-estate-law' },
];

const blk = (i, type, content) => ({ id: `blk-${i}`, type, order: i, content });
const para = (i, text) => blk(i, 'paragraph', { text });
const head = (i, text, level = 2) => blk(i, 'heading', { text, level });

// ── Static / marketing pages (contentType page). `sections` carries TOC + rich body
//    so the console editor sees structured, editable copy. ──
const PAGES = [
  {
    title: 'About Law Elite Network', slug: 'about-us', cat: 'corporate-law',
    excerpt: 'The global knowledge hub connecting members with vetted legal practitioners across 120+ jurisdictions.',
    seo: { title: 'About Us | Law Elite Network', description: 'Who we are, our editorial standards, and the team behind Law Elite Network.' },
    cf: {
      toc: [
        { label: 'Who We Are', id: 'who-we-are' },
        { label: 'Editorial Team', id: 'editorial' },
        { label: 'Legal Research & Compliance', id: 'compliance' },
        { label: 'By the Numbers', id: 'numbers' },
        { label: 'Professional Review Board', id: 'board' },
        { label: 'Management Team', id: 'management' },
      ],
    },
    blocks: [
      head(0, 'Who We Are'),
      para(1, 'Law Elite Network is a global legal knowledge platform that connects members with vetted practitioners and authoritative, fact-checked legal intelligence across more than 120 jurisdictions.'),
      head(2, 'Editorial Team'),
      para(3, 'Our editorial team pairs senior journalists with practising lawyers to produce dossiers that are accurate, current, and genuinely useful to both clients and counsel.'),
      head(4, 'Legal Research & Compliance'),
      para(5, 'Every dossier passes a three-step practitioner review before publication and is revisited on a rolling schedule to reflect changes in statute and case law.'),
    ],
  },
  {
    title: 'Careers at Law Elite Network', slug: 'careers', cat: 'corporate-law',
    excerpt: 'Build the world’s most trusted legal knowledge network. Engineering, editorial, and legal-research roles.',
    seo: { title: 'Careers | Law Elite Network', description: 'Join the team building the world’s most trusted legal knowledge network.' },
    cf: {
      toc: [
        { label: 'Our Mission', id: 'mission' },
        { label: 'Culture & Values', id: 'culture' },
        { label: 'Benefits & Growth', id: 'benefits' },
        { label: 'Open Roles', id: 'roles' },
        { label: 'Application Process', id: 'process' },
      ],
      values: [
        { icon: 'Briefcase', title: 'Excellence', desc: 'We hold our work to the standard of the courts we cover.' },
        { icon: 'Users', title: 'Collaboration', desc: 'Lawyers, engineers and editors build side by side.' },
        { icon: 'Zap', title: 'Innovation', desc: 'We use AI to augment human judgement, never to replace it.' },
      ],
    },
    blocks: [
      head(0, 'Our Mission'),
      para(1, 'We are building the world’s most trusted legal knowledge network — a place where anyone can understand the law and reach the right counsel.'),
      head(2, 'Culture & Values'),
      para(3, 'We move with the rigour of a chambers and the velocity of a startup.'),
    ],
  },
  {
    title: 'Contact Us', slug: 'contact-us', cat: 'corporate-law',
    excerpt: 'Reach the Law Elite Network concierge, editorial, press, and compliance desks.',
    seo: { title: 'Contact Us | Law Elite Network', description: 'Get in touch with the Law Elite Network teams.' },
    cf: {
      contacts: [
        { icon: 'Mail', title: 'Concierge Support', email: 'concierge@lawelitenetwork.com', desc: 'Member onboarding and account questions.' },
        { icon: 'MessageSquare', title: 'Editorial Inquiries', email: 'editorial@lawelitenetwork.com', desc: 'Corrections, sourcing, and contributions.' },
        { icon: 'Globe', title: 'Global Press', email: 'press@lawelitenetwork.com', desc: 'Media, interviews, and brand assets.' },
        { icon: 'ShieldCheck', title: 'Compliance Office', email: 'legal@lawelitenetwork.com', desc: 'Privacy, data, and regulatory matters.' },
      ],
      address: 'Law Elite Network, New Delhi, NCR, India',
    },
    blocks: [ head(0, 'How to reach us'), para(1, 'Choose the desk that best fits your enquiry and we will route you to the right team within 4–6 operational hours.') ],
  },
  {
    title: 'Editorial Process', slug: 'editorial-process', cat: 'corporate-law',
    excerpt: 'How Law Elite produces, reviews, fact-checks, and corrects its legal dossiers.',
    seo: { title: 'Editorial Process | Law Elite Network', description: 'Our standards, review board, fact-checking protocol, and corrections policy.' },
    cf: {
      toc: [
        { label: 'Our Standards', id: 'standards' },
        { label: 'Practitioner Review Board', id: 'review-board' },
        { label: 'Fact-Checking Protocol', id: 'fact-checking' },
        { label: 'Sourcing', id: 'sourcing' },
        { label: 'Corrections & Updates', id: 'corrections' },
        { label: 'Ethical Conduct', id: 'ethics' },
      ],
    },
    blocks: [
      head(0, 'Our Standards'),
      para(1, 'Every article on Law Elite Network is written to be accurate, neutral, and current. We cite primary sources and disclose any material limitations.'),
      head(2, 'Fact-Checking Protocol'),
      para(3, 'Our three-step protocol verifies statute references, case citations, and practitioner claims before anything is published.'),
    ],
  },
  {
    title: 'Privacy Policy', slug: 'privacy-policy', cat: 'corporate-law',
    excerpt: 'How Law Elite Network collects, uses, secures, and shares your information.',
    seo: { title: 'Privacy Policy | Law Elite Network', description: 'Our privacy practices and your data rights.' },
    cf: {
      toc: [
        { label: 'Information We Collect', id: 'collection' },
        { label: 'How We Use Information', id: 'usage' },
        { label: 'Data Security', id: 'security' },
        { label: 'Your Privacy Rights', id: 'rights' },
        { label: 'Cookie Policy', id: 'cookies' },
        { label: 'International Transfers', id: 'international' },
      ],
    },
    blocks: [
      head(0, 'Information We Collect'),
      para(1, 'We collect the information you provide when you create an account, book a consultation, or contact our teams, together with limited technical data needed to operate the service.'),
      head(2, 'Data Security'),
      para(3, 'Member data is encrypted in transit and at rest, and access is restricted on a least-privilege basis.'),
    ],
  },
  {
    title: 'Terms of Service', slug: 'terms-of-service', cat: 'corporate-law',
    excerpt: 'The terms governing membership and use of the Law Elite Network platform.',
    seo: { title: 'Terms of Service | Law Elite Network', description: 'Member conduct, practitioner engagement, payments, and dispute resolution.' },
    cf: {
      toc: [
        { label: 'Acceptance of Terms', id: 'acceptance' },
        { label: 'Member Conduct', id: 'conduct' },
        { label: 'Practitioner Engagement', id: 'engagement' },
        { label: 'Intellectual Property', id: 'ip' },
        { label: 'Settlement Protocols', id: 'payments' },
        { label: 'Dispute Resolution', id: 'disputes' },
        { label: 'Governing Law', id: 'governing-law' },
      ],
    },
    blocks: [
      head(0, 'Acceptance of Terms'),
      para(1, 'By accessing Law Elite Network you agree to these terms. If you do not agree, please do not use the platform.'),
      head(2, 'Practitioner Engagement'),
      para(3, 'Law Elite facilitates introductions to independent practitioners; it does not itself provide legal advice or form an attorney–client relationship.'),
    ],
  },
  {
    title: 'Advertise & Partnerships', slug: 'advertise', cat: 'corporate-law',
    excerpt: 'Reach a high-intent audience of decision-makers and legal professionals across 120+ jurisdictions.',
    seo: { title: 'Advertise | Law Elite Network', description: 'B2B partnership tiers, audience demographics, and content integration.' },
    cf: {
      toc: [
        { label: 'Platform Demographics', id: 'audience' },
        { label: 'B2B Partnership Tiers', id: 'partnerships' },
        { label: 'Content Integration', id: 'content' },
        { label: 'Brand Integrity Standards', id: 'standards' },
        { label: 'Request Media Kit', id: 'media-kit' },
      ],
      demographics: [
        { value: '50K+', label: 'Monthly Active Members' },
        { value: '120+', label: 'Global Jurisdictions' },
        { value: 'Top 1%', label: 'Decision Makers' },
      ],
    },
    blocks: [ head(0, 'Platform Demographics'), para(1, 'Law Elite reaches senior legal professionals, founders, and corporate decision-makers actively researching counsel.') ],
  },
];

// ── Membership plans (single page; tiers carried in customFields.plans) ──
const PLANS_PAGE = [
  {
    title: 'Membership Plans', slug: 'plans', cat: 'corporate-law',
    excerpt: 'Client and practitioner membership tiers for Law Elite Network.',
    seo: { title: 'Plans & Pricing | Law Elite Network', description: 'Choose a client or practitioner membership tier.' },
    cf: {
      plans: {
        client: [
          { id: 'client-basic', name: 'Basic', price: 'Free', tier: 'BASIC', features: ['Standard case posting', 'Basic lawyer discovery', 'End-to-end encrypted chat'] },
          { id: 'client-premium', name: 'Premium', price: '₹999', tier: 'PROFESSIONAL', recommended: true, features: ['Priority matching', 'AI case summaries', 'Document auditing'] },
          { id: 'client-elite', name: 'Elite', price: '₹2499', tier: 'ENTERPRISE', features: ['Unlimited document vault', '24/7 concierge', 'Predictive insights'] },
        ],
        lawyer: [
          { id: 'lawyer-basic', name: 'Basic', price: 'Free', tier: 'BASIC', features: ['Public listing', 'Messaging', 'Chambers dashboard'] },
          { id: 'lawyer-pro', name: 'Professional', price: '₹2999', tier: 'PROFESSIONAL', recommended: true, features: ['50% visibility boost', 'Analytics', 'Verified Pro badge'] },
          { id: 'lawyer-elite', name: 'Elite', price: '₹7999', tier: 'ENTERPRISE', features: ['Top-tier listing', 'Lead matching', 'Unlimited boost'] },
        ],
      },
    },
    blocks: [ head(0, 'Membership Plans'), para(1, 'Transparent tiers for clients and practitioners. Upgrade or cancel at any time.') ],
  },
];

// ── Homepage promotional content (hero + popular topics + trust metrics) ──
const HOMEPAGE = [
  {
    title: 'Law Elite Network — Home', slug: 'home', cat: 'corporate-law',
    excerpt: 'The legal knowledge hub: vetted dossiers, expert topics, and trusted counsel.',
    seo: { title: 'Law Elite Network | Global Legal Knowledge Hub', description: 'Authoritative legal dossiers and vetted practitioners across 120+ jurisdictions.' },
    cf: {
      hero: {
        label: 'Global Legal Knowledge Hub',
        title: 'The law, made navigable.',
        subtitle: 'Authoritative dossiers and vetted counsel across 120+ jurisdictions.',
        ctaPrimary: 'Explore Topics',
        ctaSecondary: 'Find Counsel',
      },
      popularTopics: [
        { name: 'Enterprise Contracts', slug: 'corporate-law' },
        { name: 'Criminal Appeals', slug: 'criminal-law' },
        { name: 'Strategic Divorce', slug: 'family-law' },
        { name: 'Global Trademarks', slug: 'intellectual-property' },
        { name: 'Visas & Citizenship', slug: 'immigration-law' },
        { name: 'Property Closings', slug: 'real-estate-law' },
      ],
      trustStats: [
        { icon: 'Globe', label: 'Global Jurisdictions', value: '120+' },
        { icon: 'Award', label: 'Expert Topics', value: '500+' },
        { icon: 'ShieldCheck', label: 'Verified Dossiers', value: '12K+' },
        { icon: 'Zap', label: 'Active Members', value: '50K+' },
      ],
    },
    blocks: [ head(0, 'The law, made navigable.'), para(1, 'Law Elite Network turns dense statute and case law into clear, practitioner-reviewed dossiers — and connects you to vetted counsel when you need more.') ],
  },
];

// ── Legal knowledge articles (contentType article). Attached to a sub-category. ──
const ARTICLES = [
  { title: 'Drafting Enforceable Commercial Contracts', slug: 'drafting-enforceable-commercial-contracts', cat: 'corporate-law-contracts',
    excerpt: 'The essential clauses every commercial contract needs to survive a dispute.',
    cf: { kind: 'article', readingTime: '6 min read', featured: true, alphabet: 'D', tags: ['contracts', 'corporate', 'drafting'] },
    blocks: [ head(0, 'Why contract structure matters'), para(1, 'A well-structured commercial contract anticipates failure: it defines obligations, remedies, and the forum for resolving disputes before they arise.'), head(2, 'Core clauses'), para(3, 'Scope, consideration, term and termination, limitation of liability, indemnity, governing law, and dispute resolution form the backbone of an enforceable agreement.') ],
    seo: { title: 'Drafting Enforceable Commercial Contracts | Law Elite', description: 'The essential clauses every commercial contract needs.' } },
  { title: 'Corporate Compliance: A Practical Framework', slug: 'corporate-compliance-practical-framework', cat: 'corporate-law-compliance',
    excerpt: 'Build a compliance program that regulators respect and teams actually follow.',
    cf: { kind: 'article', readingTime: '7 min read', featured: false, alphabet: 'C', tags: ['compliance', 'corporate', 'governance'] },
    blocks: [ head(0, 'From policy to practice'), para(1, 'Effective compliance is operational, not aspirational. It lives in workflows, approvals, and audit trails — not just in a binder.') ],
    seo: { title: 'Corporate Compliance Framework | Law Elite', description: 'A practical compliance framework for modern companies.' } },
  { title: 'Understanding DUI Defense Strategies', slug: 'understanding-dui-defense-strategies', cat: 'criminal-law-dui-defense',
    excerpt: 'How experienced defense counsel challenge stops, tests, and procedure.',
    cf: { kind: 'article', readingTime: '5 min read', featured: true, alphabet: 'U', tags: ['criminal', 'dui', 'defense'] },
    blocks: [ head(0, 'The anatomy of a DUI case'), para(1, 'A DUI defense often turns on procedure: the legality of the stop, the calibration of testing equipment, and the chain of custody for samples.') ],
    seo: { title: 'DUI Defense Strategies | Law Elite', description: 'How defense counsel challenge DUI cases.' } },
  { title: 'White-Collar Investigations: What to Expect', slug: 'white-collar-investigations-what-to-expect', cat: 'criminal-law-white-collar',
    excerpt: 'A clear-eyed guide to the stages of a white-collar investigation.',
    cf: { kind: 'article', readingTime: '8 min read', featured: false, alphabet: 'W', tags: ['criminal', 'white-collar', 'investigations'] },
    blocks: [ head(0, 'Early signals'), para(1, 'Document preservation notices and subpoenas are often the first sign of an investigation. Early counsel materially changes outcomes.') ],
    seo: { title: 'White-Collar Investigations | Law Elite', description: 'The stages of a white-collar investigation explained.' } },
  { title: 'Child Custody: Standards Courts Apply', slug: 'child-custody-standards-courts-apply', cat: 'family-law-child-custody',
    excerpt: 'The best-interests standard and the factors that decide custody.',
    cf: { kind: 'article', readingTime: '6 min read', featured: true, alphabet: 'C', tags: ['family', 'custody', 'divorce'] },
    blocks: [ head(0, 'The best-interests standard'), para(1, 'Courts weigh stability, each parent’s capacity, the child’s relationships, and — where appropriate — the child’s own preferences.') ],
    seo: { title: 'Child Custody Standards | Law Elite', description: 'How courts decide custody under the best-interests standard.' } },
  { title: 'Navigating the Divorce Process', slug: 'navigating-the-divorce-process', cat: 'family-law-divorce',
    excerpt: 'From filing to settlement: a practical map of the divorce process.',
    cf: { kind: 'article', readingTime: '7 min read', featured: false, alphabet: 'N', tags: ['family', 'divorce'] },
    blocks: [ head(0, 'Filing and disclosure'), para(1, 'Most jurisdictions require full financial disclosure early. Getting this right reduces conflict and cost downstream.') ],
    seo: { title: 'Navigating Divorce | Law Elite', description: 'A practical map of the divorce process.' } },
  { title: 'Work Visas: Choosing the Right Category', slug: 'work-visas-choosing-the-right-category', cat: 'immigration-law-visas',
    excerpt: 'Match the visa category to the role, the employer, and the timeline.',
    cf: { kind: 'article', readingTime: '6 min read', featured: true, alphabet: 'W', tags: ['immigration', 'visas', 'work'] },
    blocks: [ head(0, 'Category fit'), para(1, 'The right category depends on the role’s skill level, the sponsoring employer, and how quickly the candidate must start.') ],
    seo: { title: 'Choosing a Work Visa | Law Elite', description: 'How to choose the right work-visa category.' } },
  { title: 'Patent Protection for Startups', slug: 'patent-protection-for-startups', cat: 'intellectual-property-patents',
    excerpt: 'When to file, what to claim, and how to budget patent strategy.',
    cf: { kind: 'article', readingTime: '7 min read', featured: true, alphabet: 'P', tags: ['ip', 'patents', 'startups'] },
    blocks: [ head(0, 'File early, claim broadly'), para(1, 'A provisional filing secures a priority date cheaply; the full specification can follow as the invention matures.') ],
    seo: { title: 'Patent Protection for Startups | Law Elite', description: 'When and how startups should pursue patents.' } },
  { title: 'Trademarks: Building a Defensible Brand', slug: 'trademarks-building-a-defensible-brand', cat: 'intellectual-property-trademarks',
    excerpt: 'Clearance, registration, and enforcement for a brand that holds up.',
    cf: { kind: 'article', readingTime: '5 min read', featured: false, alphabet: 'T', tags: ['ip', 'trademarks', 'brand'] },
    blocks: [ head(0, 'Clearance first'), para(1, 'A clearance search before launch is the cheapest insurance against a costly rebrand later.') ],
    seo: { title: 'Building a Defensible Brand | Law Elite', description: 'Trademark clearance, registration, and enforcement.' } },
  { title: 'Commercial Leasing: Terms That Matter', slug: 'commercial-leasing-terms-that-matter', cat: 'real-estate-law-leasing',
    excerpt: 'The lease clauses that decide who pays when things go wrong.',
    cf: { kind: 'article', readingTime: '6 min read', featured: true, alphabet: 'C', tags: ['real-estate', 'leasing', 'commercial'] },
    blocks: [ head(0, 'Rent is only the start'), para(1, 'Repair obligations, assignment rights, and break clauses often matter more than the headline rent.') ],
    seo: { title: 'Commercial Leasing Terms | Law Elite', description: 'The commercial lease clauses that matter most.' } },
  { title: 'Resolving Property Boundary Disputes', slug: 'resolving-property-boundary-disputes', cat: 'real-estate-law-disputes',
    excerpt: 'Survey evidence, adverse possession, and routes to resolution.',
    cf: { kind: 'article', readingTime: '6 min read', featured: false, alphabet: 'R', tags: ['real-estate', 'disputes', 'property'] },
    blocks: [ head(0, 'Start with the survey'), para(1, 'Most boundary disputes are resolved — or avoided — by an authoritative survey and a clear paper trail of title.') ],
    seo: { title: 'Property Boundary Disputes | Law Elite', description: 'How property boundary disputes are resolved.' } },
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
  for (const pass of [0, 1]) {
    for (const c of CATEGORIES) {
      const isChild = !!c.parent;
      if ((pass === 0) === isChild) continue; // pass 0 = parents, pass 1 = children
      if (map[c.slug]) { skipped++; continue; }
      const payload = { name: c.name, slug: c.slug };
      if (c.parent) payload.parentId = map[c.parent];
      if (c.cf) payload.seoMetadata = {};
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

async function ensureContent(token, catMap, items, contentType, extraCf = {}) {
  let created = 0, skipped = 0;
  const touched = [];
  const map = await fetchContent(token);
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

  const pages    = await ensureContent(token, cats.map, PAGES,     'page', { kind: 'page' });
  const plans    = await ensureContent(token, cats.map, PLANS_PAGE,'page', { kind: 'plans' });
  const home     = await ensureContent(token, cats.map, HOMEPAGE,  'page', { kind: 'homepage' });
  const articles = await ensureContent(token, cats.map, ARTICLES,  'article', { kind: 'article' });

  const allSlugs = [pages, plans, home, articles].flatMap((r) => r.touched);
  const pub = await publishAll(token, allSlugs);

  console.log(JSON.stringify({
    ok: true,
    website: WEBSITE_ID,
    categories: { created: cats.created, skipped: cats.skipped, total: Object.keys(cats.map).length },
    content: { pages: pages.created, plans: plans.created, homepage: home.created, articles: articles.created, totalTouched: allSlugs.length },
    publish: pub,
  }, null, 2));
}

main().catch((e) => { console.error('seed failed:', e.message); process.exit(1); });
