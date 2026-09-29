/**
 * The Baalvion Network — real, verified properties across the platform.
 *
 * This is intentionally NOT CMS-driven (unlike Projects/Ecosystem): it is a
 * small, hand-curated registry of actual live domains, mirroring the source
 * of truth already used on baalvion.com (see baalvion-com-main/src/lib/content.ts
 * NETWORK export) so the two sites never disagree about what is real.
 *
 * Every `href` below has been verified to resolve with a 200 response, and
 * every `description` is taken verbatim/adapted from that property's own
 * README tagline or live meta description — never invented. Do not add a
 * domain here until it is actually live: this page is indexed by Google, and
 * a dead link here is a crawl error, not a preview.
 */

export type NetworkStatus = 'Live' | 'In Development';

export interface NetworkEntry {
  /** Stable slug, used for the card's DOM id and the /network/[slug] detail route. */
  slug: string;
  /** Display name of the property, as it actually presents itself live. */
  name: string;
  /** One-line, factual description — sourced from the property's own README/metadata. */
  description: string;
  /** Canonical public URL. */
  href: string;
  /** The domain shown on the card (matches `href`'s host). */
  domain: string;
  /** Grouping used to render the page's sections. */
  group: 'Corporate' | 'Platforms' | 'Independent Brands';
  status: NetworkStatus;
  /** Primary technologies, for the small badge row — matches the app's own README badges. */
  stack: string[];
  /** Path under /network/ to a screenshot in /public. */
  screenshot: {
    src: string;
    width: number;
    height: number;
    alt: string;
  };
}

export const NETWORK_ENTRIES: NetworkEntry[] = [
  // ---- Corporate --------------------------------------------------------
  {
    slug: 'baalvion',
    name: 'Baalvion',
    description:
      'The flagship corporate identity hub — a holding company for foundational infrastructure, designing, building, and operating the systems beneath global trade, markets, and digital ecosystems.',
    href: 'https://baalvion.com',
    domain: 'baalvion.com',
    group: 'Corporate',
    status: 'Live',
    stack: ['Next.js 15', 'React 19', 'TypeScript'],
    screenshot: {
      src: '/network/baalvion.com.png',
      width: 1600,
      height: 1000,
      alt: 'Baalvion — the flagship corporate site at baalvion.com',
    },
  },
  {
    slug: 'investor-relations',
    name: 'Investor Relations',
    description:
      'Institutional Investor Relations portal — the investment story, governance, board resolutions and strategic materials, plus a session-gated investor dashboard and data room.',
    href: 'https://ir.baalvion.com',
    domain: 'ir.baalvion.com',
    group: 'Corporate',
    status: 'Live',
    stack: ['Next.js 15', 'React 19', 'TypeScript'],
    screenshot: {
      src: '/network/ir.baalvion.com.png',
      width: 1600,
      height: 1000,
      alt: 'Baalvion Investor Relations at ir.baalvion.com',
    },
  },

  // ---- Platforms ----------------------------------------------------------
  {
    slug: 'global-trade-infrastructure',
    name: 'Global Trade Infrastructure',
    description:
      'A neutral, institutional infrastructure layer for international trade — 388 seeded ports, a maritime waypoint routing engine, a booking wizard, customs and compliance tooling, paired with an authenticated trade-operations control center.',
    href: 'https://trade.baalvion.com',
    domain: 'trade.baalvion.com',
    group: 'Platforms',
    status: 'Live',
    stack: ['Next.js 15', 'React 18', 'TypeScript'],
    screenshot: {
      src: '/network/global-trade-infrastructure.png',
      width: 1600,
      height: 1000,
      alt: 'Global Trade Infrastructure — the Baalvion trade operations platform at trade.baalvion.com',
    },
  },
  {
    slug: 'world-shipping-directory',
    name: 'World Shipping Directory',
    description:
      'A reference registry of merchant and state-operated vessels keyed on IMO number, and of the companies that own and operate them — founders, leadership, fleets, tonnage, flag states, and published capacity rankings, every figure sourced. Runs on its own subdomain within Global Trade Infrastructure.',
    href: 'https://ships.baalvion.com',
    domain: 'ships.baalvion.com',
    group: 'Platforms',
    status: 'Live',
    stack: ['Next.js 15', 'React 18', 'TypeScript'],
    screenshot: {
      src: '/network/ships.baalvion.com.png',
      width: 1600,
      height: 1000,
      alt: 'World Shipping Directory at ships.baalvion.com',
    },
  },
  {
    slug: 'talentos',
    name: 'TalentOS',
    description:
      'A public, SEO-first careers site combined with a full applicant-tracking-system console and a candidate self-service portal — engineering, mining, media and operations roles across India and worldwide, one application, one dashboard, one Candidate ID.',
    href: 'https://jobs.baalvion.com',
    domain: 'jobs.baalvion.com',
    group: 'Platforms',
    status: 'Live',
    stack: ['Next.js 15', 'React 18', 'TypeScript'],
    screenshot: {
      src: '/network/jobs.baalvion.com.png',
      width: 1600,
      height: 1000,
      alt: 'TalentOS by Baalvion — careers and hiring at jobs.baalvion.com',
    },
  },
  {
    slug: 'baalvion-intelligence',
    name: 'Baalvion Intelligence',
    description:
      'Real-time global news intelligence — monitors companies, competitors, industries, and world events with AI-powered summaries, trends, sentiment, and alerts; a news API built for AI agents and businesses.',
    href: 'https://signal.baalvion.com',
    domain: 'signal.baalvion.com',
    group: 'Platforms',
    status: 'Live',
    stack: ['Next.js 15', 'React 19', 'TypeScript'],
    screenshot: {
      src: '/network/signal.baalvion.com.png',
      width: 1600,
      height: 1000,
      alt: 'Baalvion Intelligence — real-time global news intelligence at signal.baalvion.com',
    },
  },

  // ---- Independent Brands -------------------------------------------------
  {
    slug: 'controlthemarket',
    name: 'ControlTheMarket',
    description:
      'A proof-of-skill hiring platform — companies discover verified talent through real-world performance, not resumes — operated as an independent brand within the Baalvion portfolio.',
    href: 'https://controlthemarket.com',
    domain: 'controlthemarket.com',
    group: 'Independent Brands',
    status: 'Live',
    stack: ['Next.js 15', 'React 19', 'TypeScript'],
    screenshot: {
      src: '/network/controlthemarket.com.png',
      width: 1600,
      height: 1000,
      alt: 'ControlTheMarket at controlthemarket.com',
    },
  },
  {
    slug: 'law-elite-network',
    name: 'Law Elite Network',
    description:
      "The Baalvion platform's legal knowledge and practitioner-discovery surface — plain-language legal guides worldwide, finding lawyers, booking consultations, and managing cases.",
    href: 'https://lawelitenetwork.com',
    domain: 'lawelitenetwork.com',
    group: 'Independent Brands',
    status: 'Live',
    stack: ['Next.js 15', 'React 19', 'TypeScript'],
    screenshot: {
      src: '/network/lawelitenetwork.com.png',
      width: 1600,
      height: 1000,
      alt: 'Law Elite Network at lawelitenetwork.com',
    },
  },
  {
    slug: 'imperialpedia',
    name: 'Imperialpedia',
    description:
      'The financial-intelligence and knowledge property of the Baalvion platform — an Investopedia-style encyclopedia, newsroom, and knowledge graph with financial calculators and an AI-Analyst suite.',
    href: 'https://imperialpedia.com',
    domain: 'imperialpedia.com',
    group: 'Independent Brands',
    status: 'Live',
    stack: ['Next.js 15', 'React 19', 'TypeScript'],
    screenshot: {
      src: '/network/imperialpedia.com.png',
      width: 1600,
      height: 1000,
      alt: 'Imperialpedia — financial intelligence knowledge graph at imperialpedia.com',
    },
  },
  {
    slug: 'amarise-maison-avenue',
    name: 'Amarisé Maison Avenue',
    description:
      'The ultra-luxury maison storefront of the Baalvion platform — a multi-market, SEO-rich commerce experience for haute couture, fine watches, and jewelry.',
    href: 'https://amarisemaisonavenue.com',
    domain: 'amarisemaisonavenue.com',
    group: 'Independent Brands',
    status: 'Live',
    stack: ['Next.js 15', 'React 19', 'TypeScript'],
    screenshot: {
      src: '/network/amarisemaisonavenue.com.png',
      width: 1600,
      height: 1000,
      alt: 'Amarisé Maison Avenue at amarisemaisonavenue.com',
    },
  },
  {
    slug: 'baalvion-insiders',
    name: 'Baalvion Insiders',
    description:
      'An exclusive community for elite members — high-value discussions, insider deals, and a marketplace connecting investors, founders, and innovators.',
    href: 'https://marketunderworld.com',
    domain: 'marketunderworld.com',
    group: 'Independent Brands',
    status: 'Live',
    stack: ['Next.js 15', 'React 19', 'TypeScript'],
    screenshot: {
      src: '/network/marketunderworld.com.png',
      width: 1600,
      height: 1000,
      alt: 'Baalvion Insiders at marketunderworld.com',
    },
  },
];

/**
 * Domains that exist in code/config but do not yet resolve live (checked via
 * DNS + HTTP before every edit to this file). Never rendered or linked from
 * the page — listed here only so the next pass doesn't have to re-discover
 * them. Move an entry up to NETWORK_ENTRIES once it actually serves a 200.
 */
export const NOT_YET_LIVE_DOMAINS = [
  'mining.baalvion.com', // DNS resolves, HTTP 404
  'connect.baalvion.com', // no response
  'dashboard.baalvion.com', // no response
  'help.baalvion.com', // app fully built locally, DNS not configured yet
];
