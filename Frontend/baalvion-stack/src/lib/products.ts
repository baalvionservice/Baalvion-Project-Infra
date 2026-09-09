/**
 * The product catalogue.
 *
 * There is exactly ONE source for which products exist, what they are called, where they live and
 * whether they are running: `@baalvion/sites`. This file adds editorial copy on top of it and
 * nothing else.
 *
 * That split is the entire point. Four separate product lists already had to be superseded by the
 * registry (auth-service's brandFromOrigin, notification-service's brands, admin-service's
 * platformRegistryService, about-baalvion's network.ts), because each one was a hand-maintained
 * array that silently fell behind. about-baalvion still lists 11 products while the registry knows
 * 19 — that gap is what a second hardcoded array buys you. Adding a site to the registry makes it
 * appear here automatically; there is no list to forget to update.
 *
 * Copy is keyed by the registry's own `site_id`, and a product with no entry still renders — with
 * its registry name and no description. A missing description shows as missing. Nothing here
 * invents a tagline, a launch date, a user count or a customer logo.
 */
import { SITES } from '@baalvion/sites';

export type ProductStatus = 'live' | 'not_live' | 'internal';

/** Broad grouping for the index page. Not in the registry — it is presentation, not identity. */
export type ProductCategory =
  | 'Corporate'
  | 'Trade & Logistics'
  | 'Commerce'
  | 'Markets & Talent'
  | 'Knowledge'
  | 'Community'
  | 'Platform';

/** Order the sections appear in. */
export const CATEGORY_ORDER: ProductCategory[] = [
  'Corporate',
  'Trade & Logistics',
  'Markets & Talent',
  'Knowledge',
  'Commerce',
  'Community',
  'Platform',
];

interface Copy {
  /** Display name, when the property presents itself differently from its registry name. */
  name?: string;
  category: ProductCategory;
  /**
   * The property's OWN headline, read off its live homepage. Not written here — it is how the
   * product introduces itself to its own visitors, which is the most honest short line available.
   * Absent for anything not serving traffic, because there is no homepage to read it from.
   */
  tagline?: string;
  /**
   * One factual paragraph. Sourced from the property's own README or its catalog descriptor —
   * never written to sell. If a product has no honest description yet, leave it out.
   */
  description?: string;
  /** What it does, as short factual phrases. Same sourcing rule as `description`. */
  capabilities?: string[];
}

/**
 * Editorial copy, keyed by registry site id.
 *
 * Every description below is lifted from the property's own README one-liner or from its service
 * descriptor in `Backend/catalog/`, both of which are maintained alongside the code. Where a
 * product has neither, it carries a category and no prose rather than a written-for-the-occasion
 * summary.
 */
const COPY: Record<string, Copy> = {
  baalvion: {
    category: 'Corporate',
    tagline: 'Global infrastructure intelligence',
    description:
      'The flagship corporate identity hub — a holding company for foundational infrastructure, designing, building, and operating the systems beneath global trade, markets, and digital ecosystems.',
  },
  about: {
    name: 'About Baalvion',
    category: 'Corporate',
    tagline: 'Operating the Global Trade Infrastructure',
    description:
      'The corporate authority website — a CMS-driven, SEO-first publication of Baalvion Industries’ company, ecosystem, and project content, served from the central platform CMS.',
  },
  ir: {
    name: 'Investor Relations',
    category: 'Corporate',
    tagline: 'Building the operating system for global trade.',
    description:
      'Institutional Investor Relations portal — the investment story, governance, board resolutions and strategic materials, plus a session-gated investor dashboard and data room.',
  },

  gti: {
    name: 'Global Trade Infrastructure',
    category: 'Trade & Logistics',
    tagline: 'Sourcing to settlement. On one platform.',
    description:
      'A neutral, institutional infrastructure layer for international trade — seeded ports, a maritime waypoint routing engine, a booking wizard, and customs and compliance tooling, paired with an authenticated trade-operations control center.',
    capabilities: ['Port network & corridors', 'Booking & customs', 'Escrow & trade finance', 'KYC and insurance'],
  },
  ships: {
    name: 'World Shipping Directory',
    category: 'Trade & Logistics',
    tagline: 'Every shipping company, and the ships it sails.',
    description:
      'A reference registry of merchant and state-operated vessels keyed on IMO number, and of the companies that own and operate them — founders, leadership, fleets, tonnage, flag states, and published capacity rankings, every figure sourced.',
  },
  mining: {
    name: 'Baalvion Mining',
    category: 'Trade & Logistics',
    description:
      'Public website and B2B trade portal for Baalvion Mining Inc. — a global mineral supply network with compliance, market intelligence, and programmatic trade-corridor coverage.',
  },

  ctm: {
    name: 'ControlTheMarket',
    category: 'Markets & Talent',
    tagline: 'Hire by skill, not by resume.',
    description:
      'A proof-of-skill hiring platform — companies discover verified talent through real-world performance, not resumes — operated as an independent brand within the Baalvion portfolio.',
  },
  jobs: {
    name: 'TalentOS',
    category: 'Markets & Talent',
    tagline: 'Work that is judged on what you can do.',
    description:
      'A public, SEO-first careers site combined with a full applicant-tracking-system console and a candidate self-service portal — one application, one dashboard, one Candidate ID.',
  },
  insiders: {
    name: 'Baalvion Insiders',
    category: 'Markets & Talent',
    tagline: 'A private network for investors and founders.',
    description:
      'A private, invite-only network for investors and founders — a verified directory, curated deal flow, and an intake route into the Baalvion deal room.',
  },
  connect: {
    name: 'Baalvion Connect',
    category: 'Markets & Talent',
    description:
      'A brand and creator marketplace — campaign management, escrow-backed payouts, and automated matching, built on the central Baalvion identity platform.',
  },

  imperialpedia: {
    category: 'Knowledge',
    tagline: 'Financial knowledge, markets and economics — explained clearly.',
    description:
      'The financial-intelligence and knowledge property of the Baalvion platform — an encyclopedia, newsroom, and knowledge graph with financial calculators and analytical tooling.',
  },
  law: {
    name: 'Law Elite Network',
    category: 'Knowledge',
    tagline: 'Plain-language legal information for a global audience.',
    description:
      'The platform’s legal knowledge and practitioner-discovery surface — plain-language legal explainers, a contributor newsroom, and consultation booking with named practitioners.',
  },
  signal: {
    name: 'Baalvion Intelligence',
    category: 'Knowledge',
    tagline: 'Turn global news into actionable intelligence in seconds.',
    description:
      'Real-time global news intelligence — monitors companies, competitors, industries, and world events with summaries, trends, sentiment, and alerts; a news API built for agents and businesses.',
  },
  help: {
    name: 'Baalvion Help Center',
    category: 'Knowledge',
    description:
      'Documentation, onboarding, API reference and support for the Baalvion trade platform — role-based walkthroughs and a full API reference.',
  },

  amarise: {
    name: 'Amarisé Maison Avenue',
    category: 'Commerce',
    tagline: 'The art of authenticated luxury.',
    description:
      'The ultra-luxury maison storefront of the Baalvion platform — a multi-market, SEO-rich commerce experience for haute couture, fine watches, and jewellery.',
  },

  community: {
    name: 'Market Underworld Communities',
    category: 'Community',
    tagline: 'A secure node for knowledge exchange and commodity trade.',
    description:
      'Multi-community forum membership for Market Underworld — paid tiers, invites and role-based access, with the forum engine downstream and access decisions owned centrally.',
  },

  proxy: {
    name: 'Baalvion NetStack',
    category: 'Platform',
    tagline: 'Enterprise proxy and data network.',
    description:
      'Enterprise proxy infrastructure — a public marketing site, an authenticated customer console for proxies, billing, analytics and organisation management, and an internal operator admin.',
  },
  admin: {
    name: 'Admin Platform',
    category: 'Platform',
    description:
      'The central operator console for the Baalvion platform — a single console managing identity, CMS, commerce, RBAC and every domain product, behind a hierarchical authorization layer.',
  },
  dashboard: {
    name: 'Company Dashboard',
    category: 'Platform',
    description:
      'The company operating dashboard — a multi-business control surface for KPIs, financials, equity, employees and operations, with realtime updates.',
  },
};

export interface Product {
  /** The registry's stable site id. Also the URL slug, so links never depend on a display name. */
  id: string;
  name: string;
  /** The property's own live headline. Undefined when it does not serve traffic. */
  tagline?: string;
  /**
   * Screenshot of the property's actual homepage, captured from the live site.
   *
   * Real product imagery, not stock photography or a mockup — a portfolio illustrated with
   * pictures of something else is worse than one with no pictures. Undefined for anything not
   * serving traffic: there is nothing to photograph, and borrowing a sibling's screenshot would
   * show a product that does not exist.
   */
  image?: string;
  description?: string;
  capabilities?: string[];
  category: ProductCategory;
  status: ProductStatus;
  /** Primary public domain. Undefined for a product with none registered. */
  domain?: string;
  /** All registered domains, primary first. */
  domains: readonly string[];
  href?: string;
  /** Backend services that implement it, straight from the registry. */
  services: readonly string[];
  /** Whether this property takes payments, and on which rails. */
  rails: readonly string[];
}

/**
 * Products with a homepage screenshot in /public/products.
 *
 * Listed explicitly rather than assumed from status: a live property whose capture failed must
 * fall back to the no-image layout, not render a broken <img>.
 */
const CAPTURED = new Set([
  'baalvion', 'about', 'ir', 'gti', 'ships', 'ctm', 'jobs', 'insiders',
  'imperialpedia', 'law', 'signal', 'amarise', 'community', 'proxy',
]);

/** Fallback category for a registry site with no copy entry — it still gets listed. */
const UNCATEGORISED: ProductCategory = 'Platform';

function toProduct(site: (typeof SITES)[number]): Product {
  const copy = COPY[site.id];
  const domain = site.domains[0];
  const live = site.status === 'live';
  return {
    id: site.id,
    name: copy?.name ?? site.name,
    tagline: copy?.tagline,
    // Only live properties were captured, so only they carry an image.
    image: live && CAPTURED.has(site.id) ? `/products/${site.id}.jpg` : undefined,
    description: copy?.description,
    capabilities: copy?.capabilities,
    category: copy?.category ?? UNCATEGORISED,
    status: site.status as ProductStatus,
    domain,
    domains: site.domains,
    // Only a live property gets an outbound link. Linking a not-live domain sends visitors to a
    // dead host and makes the status label look like decoration.
    href: site.status === 'live' && domain ? `https://${domain}` : undefined,
    services: site.services,
    rails: site.rails,
  };
}

/** Every registered product, in registry order. */
export const PRODUCTS: Product[] = SITES.map(toProduct);

/** Products that have a screenshot — used where the layout needs an image to work. */
export function illustrated(): Product[] {
  return PRODUCTS.filter((p) => p.image);
}

export function productById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

/** Products grouped for the index, empty categories omitted. */
export function productsByCategory(): Array<{ category: ProductCategory; products: Product[] }> {
  return CATEGORY_ORDER.map((category) => ({
    category,
    products: PRODUCTS.filter((p) => p.category === category),
  })).filter((section) => section.products.length > 0);
}

/**
 * Headline counts.
 *
 * Derived, never typed in — a hardcoded "20+ products" is exactly the kind of number that is wrong
 * within a month and that nobody notices.
 */
export function counts() {
  return {
    total: PRODUCTS.length,
    live: PRODUCTS.filter((p) => p.status === 'live').length,
    inDevelopment: PRODUCTS.filter((p) => p.status === 'not_live').length,
    internal: PRODUCTS.filter((p) => p.status === 'internal').length,
    categories: productsByCategory().length,
  };
}

export const STATUS_LABEL: Record<ProductStatus, string> = {
  live: 'Live',
  not_live: 'In development',
  internal: 'Internal',
};
