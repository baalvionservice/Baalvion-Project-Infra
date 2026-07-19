'use strict';
/**
 * Seeds the central CMS so Amarisé Maison Avenue is fully manageable from the admin
 * console AND served by the public delivery API that the storefront reads.
 *
 * It creates (idempotently):
 *   - the `amarise-maison-avenue` website (if missing)
 *   - the `homepage` document   → drives every section + image of the landing page
 *   - the `press` document       → /press logos + media coverage
 *   - `maison-story`             → /about heritage narrative
 *   - `customer-service`         → /customer-service (per-country shipping/returns/FAQ)
 *   - `membership-plans`         → /membership/plans tiers
 *   - `footer-config`            → site-wide footer nav/social/legal (all pages)
 *   - `appointments-page`        → /appointments hero/quote/benefits/experience types
 *   - `authenticity-page`        → /authenticity hero/steps/CTA
 *   - `contact-page`             → /contact form copy + inquiry types
 *   - `provenance-showcase`      → shared /private-order + /special-archive narrative
 *   - `concierge`/`advisory`/`authentication` (kind: service) → /services/[id]
 *   - `global-artifact-report` (kind: report)                → /reports/[id]
 *
 * Mirrors the typed readers in src/lib/cms.ts (getHomepage / getPressItems /
 * getMaisonStory / getCustomerService / getMembershipPlans / getFooterConfig /
 * getAppointmentsPageContent / getAuthenticityContent / getContactPageContent /
 * getProvenanceShowcase / getServices / getReports). Every image URL is left
 * empty on purpose — the owner uploads real photography from the admin Media library
 * and pastes the URL; until then <BrandImage> renders an elegant branded panel.
 *
 * Idempotent: existing slugs are skipped on create, and any draft/approved item is
 * transitioned to `published` so it is visible on the public API.
 *
 *   AUTH_URL=http://localhost:3001/v1/auth \
 *   CMS_URL=http://localhost:3011/api/v1 \
 *   SUPERADMIN_EMAIL=superadmin@baalvion.com \
 *   SUPERADMIN_PASSWORD=*** \
 *   node scripts/seed-amarise-cms.cjs
 *
 * NOTE: CMS_URL must point at wherever cms-service actually listens (gateway or the
 * service directly). The publishing user must have cms-publisher rights on the
 * website — creating the website here makes the seed user its cms_admin automatically.
 */
const AUTH = process.env.AUTH_URL || 'http://localhost:3001/v1/auth';
const CMS = process.env.CMS_URL || 'http://localhost:3011/api/v1';
const EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@baalvion.com';
const PW = process.env.SUPERADMIN_PASSWORD;
const WEBSITE_SLUG = process.env.WEBSITE_SLUG || 'amarise-maison-avenue';
const WEBSITE_DOMAIN = process.env.WEBSITE_DOMAIN || 'amarise.baalvion.com';

// ── HTTP helpers ─────────────────────────────────────────────────────────────
async function req(method, url, token, body) {
  const r = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  return { status: r.status, data };
}
const jget = (url, token) => req('GET', url, token);
const jpost = (url, token, body) => req('POST', url, token, body);

async function login() {
  const res = await jpost(`${AUTH}/login`, null, { email: EMAIL, password: PW });
  const token = res.data?.data?.accessToken || res.data?.accessToken;
  if (!token) throw new Error('login failed: ' + JSON.stringify(res.data).slice(0, 240));
  return token;
}

async function getOrCreateWebsite(token) {
  if (process.env.WEBSITE_ID) return process.env.WEBSITE_ID;
  // Find an existing website with our slug (org-scoped list).
  const list = await jget(`${CMS}/cms/websites?limit=100`, token);
  const rows = list.data?.data || list.data?.websites || [];
  const found = Array.isArray(rows) && rows.find((w) => w.slug === WEBSITE_SLUG);
  if (found) return found.id;

  const res = await jpost(`${CMS}/cms/websites`, token, {
    name: 'Amarisé Maison Avenue',
    slug: WEBSITE_SLUG,
    domain: WEBSITE_DOMAIN,
    description:
      'Authenticated luxury maison — rare and pre-owned Hermès, Chanel and fine jewelry, curated since 1924.',
    plan: 'enterprise',
    modules: ['pages', 'blog', 'products', 'news'],
    config: {
      defaultLanguage: 'en',
      timezone: 'UTC',
      seoDefaults: { titleSuffix: ' | Amarisé Maison Avenue' },
    },
  });
  const id = res.data?.data?.id;
  if (!id) throw new Error('website create failed: ' + JSON.stringify(res.data).slice(0, 280));
  return id;
}

async function fetchContent(base, token) {
  const map = {};
  for (let page = 1; page <= 20; page++) {
    const res = await jget(`${base}/content?limit=100&page=${page}`, token);
    const rows = res.data?.data || [];
    for (const c of rows) map[c.slug] = { id: c.id, status: c.status };
    const p = res.data?.pagination;
    if (!p || page >= p.totalPages) break;
  }
  return map;
}

const para = (i, text) => ({ id: `blk-${i}`, type: 'paragraph', order: i, content: { text } });

// ── Content definitions (mirror src/lib/cms.ts readers) ──────────────────────
const HOMEPAGE = {
  title: 'Homepage',
  slug: 'homepage',
  contentType: 'page',
  excerpt: 'The Amarisé Maison Avenue storefront landing page.',
  contentBlocks: [
    para(0, 'Curating the world’s most exquisite treasures since 1924. Every section, image and link on the landing page is managed here.'),
  ],
  seoMetadata: {
    title: 'AMARISÉ MAISON AVENUE | The Art of Authenticated Luxury',
    description: 'Authenticated pre-owned Hermès, Chanel and fine jewelry — curated since 1924.',
  },
  customFields: {
    hero: {
      eyebrow: 'Maison Amarisé · Est. 1924',
      title: 'The Art of Authenticated Luxury',
      subtitle:
        'A century of connoisseurship. Rare and pre-owned Hermès, Chanel and fine jewelry — every piece authenticated by our master curators.',
      ctaLabel: 'Discover New Arrivals',
      ctaHref: '/category/new-arrivals-handbags',
      secondaryCtaLabel: 'Sell or Consign',
      secondaryCtaHref: '/how-to-sell',
      image: '',
    },
    announcements: [
      'Complimentary white-glove delivery worldwide',
      'Read our 100% Authenticity Guarantee',
      'Book a private appointment — in showroom or virtually',
    ],
    featuredCollections: [
      { title: 'Hermès', subtitle: 'Birkin, Kelly & the rare archive', image: '', href: '/category/hermes-handbags' },
      { title: 'Chanel', subtitle: 'Timeless flaps & vintage', image: '', href: '/category/chanel-bags' },
      { title: 'Fine Jewelry', subtitle: 'Van Cleef, Cartier & heritage', image: '', href: '/category/fine-jewelry' },
      { title: 'New Arrivals', subtitle: 'The latest acquisitions', image: '', href: '/category/new-arrivals-handbags' },
    ],
    newArrivals: {
      title: 'New Arrivals',
      subtitle: 'The latest treasures to enter the Maison, ready to ship.',
      limit: 8,
      ctaLabel: 'Shop All New Arrivals',
      ctaHref: '/category/new-arrivals-handbags',
    },
    services: [
      { icon: 'ShieldCheck', title: '100% Authenticity Guarantee', body: 'Every piece is verified in-house by master authenticators and ships with its certificate of provenance.', ctaLabel: 'Our Guarantee', href: '/authenticity' },
      { icon: 'Repeat', title: 'Sell or Consign', body: 'Receive a fast, fair quote for your Hermès, Chanel and fine jewelry. White-glove, fully insured.', ctaLabel: 'Get a Quote', href: '/how-to-sell' },
      { icon: 'Crown', title: 'Private Concierge', body: 'Personal acquisitions, private viewings and bespoke sourcing through your dedicated client advisor.', ctaLabel: 'Book an Appointment', href: '/appointments' },
    ],
    trust: {
      title: 'The Maison Standard of Authenticity',
      body: 'For a century, Amarisé has been trusted for the rare, the iconic and the extraordinary. Every acquisition passes a rigorous multi-point authentication before it is offered to our clients.',
      badge: '100% Authentic, Guaranteed',
      points: [
        'In-house expert authentication on every item',
        'Certificate of provenance with each piece',
        'Fully insured, white-glove global delivery',
        '30-day returns with complete buyer protection',
      ],
    },
    testimonials: [
      { quote: 'The most trusted name for a collector. My Birkin arrived flawless, with provenance documented to the stitch.', author: 'Isabella R.', location: 'New York' },
      { quote: 'Discreet, impeccable and genuinely expert. The concierge sourced a piece I had searched years for.', author: 'Amelia K.', location: 'London' },
      { quote: 'Consigning with Amarisé was effortless — a fair valuation and payment faster than I imagined.', author: 'Sophia L.', location: 'Dubai' },
    ],
    press: { title: 'As Seen In', subtitle: "Recognised by the world's leading authorities on luxury." },
  },
};

const PRESS = {
  title: 'Press & Media',
  slug: 'press',
  contentType: 'page',
  excerpt: 'Amarisé Maison Avenue in the press.',
  contentBlocks: [para(0, 'The Maison and its archive have been featured by the world’s foremost authorities on luxury.')],
  seoMetadata: { title: 'Press & Media | Amarisé Maison Avenue', description: 'Amarisé Maison Avenue in the press.' },
  customFields: {
    title: 'Amarisé in the Press',
    subtitle:
      "The Maison and its archive have been featured by the world's foremost authorities on luxury, investment and style.",
    logos: [
      { name: 'Vogue', image: '', href: '#' },
      { name: 'Bloomberg', image: '', href: '#' },
      { name: 'Financial Times', image: '', href: '#' },
      { name: 'WWD', image: '', href: '#' },
      { name: 'Robb Report', image: '', href: '#' },
      { name: "Harper's Bazaar", image: '', href: '#' },
    ],
    articles: [
      { title: 'Why authenticated pre-owned luxury is the new investment class', outlet: 'Bloomberg', date: '2026', excerpt: 'Inside the houses setting the standard for provenance and trust in the secondary luxury market.', href: '#', image: '' },
      { title: 'The collectors quietly building museum-grade archives', outlet: 'Financial Times', date: '2026', excerpt: 'How a new generation of connoisseurs is treating the Birkin and the flap bag as heritage assets.', href: '#', image: '' },
      { title: 'The art of the authenticated handbag', outlet: 'Vogue', date: '2025', excerpt: 'A look behind the curtain at the experts who certify the rare, the iconic and the extraordinary.', href: '#', image: '' },
    ],
  },
};

const MAISON_STORY = {
  title: 'Our Heritage',
  slug: 'maison-story',
  contentType: 'page',
  excerpt: 'A century of connoisseurship.',
  contentBlocks: [para(0, 'Since 1924, Amarisé Maison Avenue has curated the rare, the iconic and the extraordinary.')],
  seoMetadata: { title: 'About | Amarisé Maison Avenue', description: 'Our heritage since 1924.' },
  customFields: {
    title: 'A Century of Connoisseurship',
    subtitle: 'Since 1924.',
    philosophy:
      'Luxury, to Amarisé, is the meeting of human brilliance and enduring craft. We curate only the rare, the iconic and the extraordinary — and we stand behind every piece with the Maison’s authentication.',
    history: [
      { year: '1924', milestone: 'The First Atelier', description: 'Founded in Paris as a house of curation and provenance.' },
      { year: '1968', milestone: 'The Archive', description: 'The Maison begins assembling its now-renowned heritage archive.' },
      { year: '2009', milestone: 'Authentication Lab', description: 'In-house master authentication is formalised for every acquisition.' },
      { year: '2024', milestone: 'A Global Maison', description: 'Serving collectors across five markets with white-glove service.' },
    ],
    craftsmanship: [
      { title: 'Authentication', description: 'Every piece passes a rigorous multi-point verification by our master curators.', imageUrl: '' },
      { title: 'Provenance', description: 'Each acquisition is documented and ships with its certificate of provenance.', imageUrl: '' },
    ],
    sustainability:
      'To extend the life of the extraordinary is the most enduring form of responsibility. Pre-owned luxury, authenticated and cherished, is luxury at its most conscientious.',
    institutionalCharter:
      'Our mission is to maintain the standard of the absolute in every artifact we curate.',
  },
};

const CS_BLOCK = {
  shipping:
    'White-glove, fully insured delivery worldwide through our premium logistics partners. Processing 1–2 business days; transit 3–7 business days.',
  returns:
    '30-day returns on both defective and non-defective items in original condition. Free, insured return shipping; refunds within 5–7 business days of inspection.',
  faqs: [
    { question: 'How can I book a private viewing?', answer: 'Contact our concierge team to arrange a private viewing in showroom or virtually via video.' },
    { question: 'Do you offer international shipping?', answer: 'Yes — white-glove shipping worldwide with full insurance coverage.' },
    { question: 'What is your authenticity guarantee?', answer: 'Every piece undergoes rigorous in-house verification and ships with a certificate of provenance.' },
  ],
};
const CUSTOMER_SERVICE = {
  title: 'Customer Service',
  slug: 'customer-service',
  contentType: 'page',
  excerpt: 'Shipping, returns and frequently asked questions.',
  contentBlocks: [para(0, 'White-glove service, authenticity and care at every step.')],
  seoMetadata: { title: 'Customer Service | Amarisé Maison Avenue', description: 'Shipping, returns and FAQs.' },
  customFields: {
    byCountry: { us: CS_BLOCK, uk: CS_BLOCK, ae: CS_BLOCK, in: CS_BLOCK, sg: CS_BLOCK },
  },
};

const MEMBERSHIP = {
  title: 'Membership Plans',
  slug: 'membership-plans',
  contentType: 'page',
  excerpt: 'Membership tiers and benefits.',
  contentBlocks: [para(0, 'Join the Maison’s private membership for early access and concierge benefits.')],
  seoMetadata: { title: 'Membership | Amarisé Maison Avenue', description: 'Membership tiers and benefits.' },
  customFields: {
    plans: [
      { id: 'silver', name: 'Silver', price: 0, currency: 'USD', interval: 'yearly', tier: 'Silver', isPopular: false, features: ['Early access to new arrivals', 'Members-only edits', 'Standard concierge support'] },
      { id: 'gold', name: 'Gold', price: 950, currency: 'USD', interval: 'yearly', tier: 'Gold', isPopular: true, features: ['Priority access to rare pieces', 'Dedicated client advisor', 'Complimentary authentication on consignment', 'Private appointments'] },
      { id: 'diamond', name: 'Diamond', price: 4500, currency: 'USD', interval: 'yearly', tier: 'Diamond', isPopular: false, features: ['First refusal on archive pieces', 'Bespoke global sourcing', 'White-glove home previews', 'Invitations to private events'] },
    ],
  },
};

const FOOTER = {
  title: 'Footer Configuration',
  slug: 'footer-config',
  contentType: 'page',
  excerpt: 'Site-wide footer navigation, contact/social links, trust badge and legal copy.',
  contentBlocks: [para(0, 'Every footer column, contact/social link and legal link is managed here.')],
  seoMetadata: { title: 'Footer | Amarisé Maison Avenue', description: 'Footer configuration.' },
  customFields: {
    columns: [
      {
        title: 'Customer Care',
        links: [
          { label: 'Contact Us', href: '/contact' },
          { label: 'FAQ', href: '/faq' },
          { label: 'My Account', href: '/account' },
          { label: 'Track Order', href: '/track-order' },
          { label: 'Shipping & Returns', href: '/customer-service' },
          { label: 'Authenticity Guarantee', href: '/customer-service' },
          { label: 'Sell To Us', href: '/how-to-sell' },
          { label: 'Showrooms', href: '/appointments' },
        ],
      },
      {
        title: 'About',
        links: [
          { label: 'About Us', href: '/about' },
          { label: 'Visit Us', href: '/contact' },
          { label: 'Message From Our Founder', href: '/about' },
          { label: 'Affiliates', href: '/journal' },
          { label: 'Blog', href: '/journal' },
          { label: 'Press', href: '/press' },
        ],
      },
      {
        title: 'Shop',
        links: [
          { label: 'Archive Registry', href: '/category/hermes' },
          { label: 'New Arrivals', href: '/category/new-arrivals' },
          { label: 'Hermès', href: '/category/hermes' },
          { label: 'Chanel', href: '/category/chanel' },
        ],
      },
      {
        title: 'Sell With Us',
        links: [
          { label: 'How to Consign', href: '/how-to-sell' },
          { label: 'Partner Portal', href: '/sell' },
        ],
      },
    ],
    socialLinks: [
      { name: 'Phone', href: 'tel:+1234567890', icon: 'phone' },
      { name: 'Email', href: 'mailto:info@amarisemaisonavenue.com', icon: 'email' },
      { name: 'Whatsapp', href: 'https://wa.me/1234567890', icon: 'whatsapp' },
    ],
    trustBadge: {
      eyebrow: '100% Authentic',
      title: 'Guaranteed',
      description: 'The #1 Trusted Seller of New & Pre-Owned Hermès Bags',
    },
    brandName: 'AMARISÉ',
    brandSuffix: 'MAISON AVENUE',
    copyrightText:
      '© 2026 Amarisé Maison Avenue. All Rights Reserved. Amarisé Maison Avenue is a registered Trademark of Amarisé Maison Avenue Inc.',
    legalLinks: [
      { label: 'Our Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
    ],
  },
};

const APPOINTMENTS_PAGE = {
  title: 'Appointments Page',
  slug: 'appointments-page',
  contentType: 'page',
  excerpt: 'Private salon booking page hero + benefits + experience types.',
  contentBlocks: [para(0, 'Every hero line, benefit and experience-type option on /appointments is managed here.')],
  seoMetadata: { title: 'Book an Appointment | Amarisé Maison Avenue', description: 'Book a private viewing, virtual try-on, or consultation.' },
  customFields: {
    eyebrow: 'Private Salon Experience',
    title: 'Book Your Visit',
    quoteTitle: 'The Atelier Protocol',
    quote: 'An intimate exploration of the Maison’s archive, guided by our senior curators in a private environment.',
    benefits: [
      { icon: 'ShieldCheck', label: 'Complimentary Viewing', description: 'No acquisition obligation.' },
      { icon: 'Globe', label: 'Global Concierge', description: 'Available in all 5 international hubs.' },
      { icon: 'Sparkles', label: 'Bespoke Presentation', description: 'Curated selection based on your taste.' },
    ],
    appointmentTypes: [
      { value: 'showroom', label: 'Private Showroom Viewing' },
      { value: 'virtual', label: 'Virtual Try-on' },
      { value: 'in_home', label: 'In-Home Presentation' },
      { value: 'phone', label: 'Telephone Consultation' },
    ],
  },
};

const AUTHENTICITY_PAGE = {
  title: 'Authenticity Page',
  slug: 'authenticity-page',
  contentType: 'page',
  excerpt: 'The authenticity guarantee explainer shown on /authenticity.',
  contentBlocks: [para(0, 'The 4-step authentication explainer and closing CTA on /authenticity are managed here.')],
  seoMetadata: { title: 'Authenticity Guarantee | Amarisé Maison Avenue', description: 'Every acquisition is authenticated and certified.' },
  customFields: {
    eyebrow: 'The AMARISÉ Standard',
    title: 'Authenticity, Guaranteed.',
    subtitle: 'Provenance is the soul of an artifact. Every piece in our registry is authenticated by experts and certified — so your acquisition is beyond question.',
    steps: [
      { icon: 'Microscope', title: 'Expert Examination', body: 'In-house gemologists and master authenticators inspect hardware, stitching, materials, date codes and provenance against verified references.' },
      { icon: 'Fingerprint', title: 'Provenance Verification', body: 'Ownership history and documentation are validated. Pieces without a verifiable chain of provenance never enter the registry.' },
      { icon: 'FileText', title: 'Certificate of Authenticity', body: 'Each acquisition is issued a uniquely numbered certificate that accompanies the piece and is recorded in your account.' },
      { icon: 'ShieldCheck', title: 'Lifetime Guarantee', body: 'Our Authenticity Guarantee stands for the life of the piece. A verified inauthenticity claim is met with a full refund and complimentary return.' },
    ],
    ctaTitle: 'A question of provenance?',
    ctaSubtitle: 'Our specialists are available for a private dialogue.',
    ctaLabel: 'Contact a Specialist',
  },
};

const CONTACT_PAGE = {
  title: 'Contact Page',
  slug: 'contact-page',
  contentType: 'page',
  excerpt: 'Contact form copy and inquiry types shown on /contact.',
  contentBlocks: [para(0, 'The contact form headline, subtitle and inquiry-type options are managed here.')],
  seoMetadata: { title: 'Contact | Amarisé Maison Avenue', description: 'Reach the Maison concierge team.' },
  customFields: {
    title: 'Speak with the Maison',
    subtitle: 'Our concierge team is at your disposal for bespoke requests, private appointments, and heritage inquiries.',
    inquiryTypes: [
      { value: 'bespoke', label: 'Bespoke Commission' },
      { value: 'salon', label: 'Private Salon Appointment' },
      { value: 'order', label: 'Order Support' },
      { value: 'press', label: 'Press & Media' },
    ],
  },
};

const PROVENANCE_SHOWCASE = {
  title: 'Provenance Showcase',
  slug: 'provenance-showcase',
  contentType: 'page',
  excerpt: 'Shared provenance/narrative copy used on /private-order/[id] and /special-archive/[id].',
  contentBlocks: [para(0, 'The generic Maison provenance narrative shown alongside real per-product data.')],
  seoMetadata: { title: 'Provenance | Amarisé Maison Avenue', description: 'Maison provenance and security standard.' },
  customFields: {
    narrative: 'This artifact represents the absolute pinnacle of the Maison’s craftsmanship. Hand-finished in our central atelier, it serves as a testament to human brilliance and the pursuit of the absolute standard. Every stitch and material selection has been audited for heritage compliance, ensuring its position as a primary pillar of any elite collection.',
    originLabel: 'Maison Central Ateliers, Heritage Series v1.2. Audited provenance records included.',
    authenticityLabel: 'NFC Certification Included',
    securityMatrixTitle: 'Security Matrix',
    securityMatrixBody: 'NFC Authenticity Certification and Secure Digital Ledger Tracking.',
  },
};

// Maison services (kind: 'service') — /services/[id]
const SERVICE_CONCIERGE = {
  title: 'Maison Concierge',
  slug: 'concierge',
  contentType: 'page',
  excerpt: 'A private concierge service dedicated to sourcing rare artifacts globally.',
  contentBlocks: [para(0, 'Maison Concierge service detail page content.')],
  seoMetadata: { title: 'Maison Concierge | Amarisé Maison Avenue', description: 'Private concierge acquisition service.' },
  customFields: {
    kind: 'service',
    name: 'Maison Concierge',
    tagline: 'The Ultimate Acquisition Partner',
    description: 'A private concierge service dedicated to sourcing rare artifacts globally, managing international logistics, and providing white-glove delivery.',
    priceRange: 'On Commission',
    features: ['Global Sourcing Network', 'Tax & Duty Optimization', 'Private Viewings', 'Bespoke Logistics'],
    imageUrl: '',
  },
};
const SERVICE_ADVISORY = {
  title: 'Investment Advisory',
  slug: 'advisory',
  contentType: 'page',
  excerpt: 'Bespoke advisory for collectors seeking to build high-value artisanal portfolios.',
  contentBlocks: [para(0, 'Investment Advisory service detail page content.')],
  seoMetadata: { title: 'Investment Advisory | Amarisé Maison Avenue', description: 'Bespoke portfolio advisory service.' },
  customFields: {
    kind: 'service',
    name: 'Investment Advisory',
    tagline: 'Strategic Portfolio Curation',
    description: 'Bespoke advisory for collectors seeking to build high-value artisanal portfolios with long-term capital appreciation.',
    priceRange: 'Annual Retainer',
    features: ['Market Performance Reports', 'Private Auction Access', 'Provenance Verification', 'Exit Strategy Planning'],
    imageUrl: '',
  },
};
const SERVICE_AUTHENTICATION = {
  title: 'Heritage Registry',
  slug: 'authentication',
  contentType: 'page',
  excerpt: 'Official Maison authentication service for high-value artifacts.',
  contentBlocks: [para(0, 'Heritage Registry (authentication) service detail page content.')],
  seoMetadata: { title: 'Heritage Registry | Amarisé Maison Avenue', description: 'Official authentication service.' },
  customFields: {
    kind: 'service',
    name: 'Heritage Registry',
    tagline: 'Absolute Provenance Verification',
    description: 'Official Maison authentication service for high-value artifacts, including digital NFC certification and archival documentation.',
    priceRange: '$1,500 per Artifact',
    features: ['Atelier Inspection', 'Digital Heritage Seal', 'Blockchain Tracking', 'Official Appraisal'],
    imageUrl: '',
  },
};

// Maison intelligence reports (kind: 'report') — /reports/[id]. `body` (contentBlocks
// paragraphs) is left for a real curator to author — no fabricated market claim is seeded.
const REPORT_GLOBAL_ARTIFACT = {
  title: 'The Global Artifact Appreciation Study',
  slug: 'global-artifact-report',
  contentType: 'page',
  excerpt: 'A deep dive into the performance of heritage luxury goods in the current economic climate.',
  contentBlocks: [
    para(0, 'This report body is intentionally left for a Maison curator to author with real, verifiable findings — no placeholder market claim is seeded here.'),
  ],
  seoMetadata: { title: 'Maison Intelligence | Amarisé Maison Avenue', description: 'Curatorial market intelligence report.' },
  customFields: {
    kind: 'report',
    title: 'The Global Artifact Appreciation Study',
    summary: 'A deep dive into the performance of heritage luxury goods in the current economic climate.',
    author: 'Maison Amarisé Curatorial Desk',
    date: '',
    isPremium: true,
    priceLabel: '',
    previewImage: '',
  },
};

const DOCS = [
  HOMEPAGE, PRESS, MAISON_STORY, CUSTOMER_SERVICE, MEMBERSHIP, FOOTER,
  APPOINTMENTS_PAGE, AUTHENTICITY_PAGE, CONTACT_PAGE, PROVENANCE_SHOWCASE,
  SERVICE_CONCIERGE, SERVICE_ADVISORY, SERVICE_AUTHENTICATION, REPORT_GLOBAL_ARTIFACT,
];

async function main() {
  if (!PW) throw new Error('SUPERADMIN_PASSWORD is required');
  const token = await login();
  const websiteId = await getOrCreateWebsite(token);
  const base = `${CMS}/cms/websites/${websiteId}`;

  let existing = await fetchContent(base, token);
  const touched = [];
  let created = 0,
    skipped = 0,
    failed = 0;

  for (const doc of DOCS) {
    touched.push(doc.slug);
    if (existing[doc.slug]) {
      skipped++;
      continue;
    }
    const res = await jpost(`${base}/content`, token, doc);
    if (res.status === 201 || res.status === 200) created++;
    else if (res.status === 409) skipped++;
    else {
      failed++;
      console.error(`  create ${doc.slug} -> ${res.status} ${JSON.stringify(res.data).slice(0, 240)}`);
    }
  }

  // Publish everything we touched (re-fetch to pick up freshly-created ids).
  existing = await fetchContent(base, token);
  let published = 0,
    already = 0,
    pubFailed = 0;
  for (const slug of touched) {
    const rec = existing[slug];
    if (!rec) {
      pubFailed++;
      continue;
    }
    if (!['draft', 'approved'].includes(rec.status)) {
      already++;
      continue;
    }
    const res = await jpost(`${base}/content/${rec.id}/workflow/transition`, token, { action: 'publish' });
    if (res.status === 200 || res.status === 201) published++;
    else {
      pubFailed++;
      console.error(`  publish ${slug} -> ${res.status} ${JSON.stringify(res.data).slice(0, 220)}`);
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        website: { id: websiteId, slug: WEBSITE_SLUG },
        content: { created, skipped, failed, touched: touched.length },
        publish: { published, already, pubFailed },
        public: `${CMS}/public/${WEBSITE_SLUG}/content/homepage`,
      },
      null,
      2
    )
  );
}

main().catch((e) => {
  console.error('seed failed:', e.message);
  process.exit(1);
});
