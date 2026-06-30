/**
 * baalvion.com — single source of truth for all corporate copy and the
 * portfolio index. The corporate apex references the platform layer and the
 * independent brands as links only; no product UI exists on this site.
 *
 * Voice: structural, calm, authoritative. Every figure is defensible —
 * domains, layers, platforms, brands, posture — never invented financials,
 * named customers, or awards.
 */

export const SITE = {
  name: 'Baalvion',
  url: 'https://baalvion.com',
  tagline: 'Global infrastructure intelligence',
  description:
    'Baalvion is a holding company for foundational infrastructure — designing, building, and operating the systems beneath global trade, markets, and digital ecosystems. Engineered for permanence, governed for trust, held for the long horizon.',
} as const;

export const EXTERNAL = {
  about: 'https://about.baalvion.com',
  ir: 'https://ir.baalvion.com',
} as const;

/**
 * On-site routes. Every menu item and footer link resolves to a real page that
 * is emitted by the static export — no dead anchors, no off-site dependency for
 * the company's own legal and account surfaces.
 */
export const ROUTES = {
  home: '/',
  about: '/about',
  services: '/services',
  contact: '/contact',
  email: '/email',
  security: '/security',
  signin: '/signin',
  register: '/register',
  recovery: '/account/recovery',
  privacy: '/legal/privacy',
  terms: '/legal/terms',
  cookies: '/legal/cookies',
  acceptableUse: '/legal/acceptable-use',
  dataProtection: '/legal/data-protection',
} as const;

/** Verified contact channels. All addresses are on the sending domain. */
export const CONTACT = {
  support: 'support@baalvion.com',
  business: 'hello@baalvion.com',
  privacy: 'privacy@baalvion.com',
  security: 'security@baalvion.com',
  legal: 'legal@baalvion.com',
  abuse: 'abuse@baalvion.com',
  responseWindow: 'Within 2 business days',
  regions: ['Americas', 'EMEA', 'APAC'],
} as const;

export const NAV = [
  { label: 'Company', href: ROUTES.about },
  { label: 'Platform', href: ROUTES.services },
  { label: 'Network', href: '/#network' },
  { label: 'Email', href: ROUTES.email },
  { label: 'Contact', href: ROUTES.contact },
] as const;

export const HERO = {
  eyebrow: 'Baalvion — The Corporate Foundation',
  headline: 'Global infrastructure intelligence',
  subline:
    'Baalvion designs, builds, and operates the foundational systems beneath global trade, markets, and digital ecosystems — infrastructure engineered for permanence, governed for trust, and held for the long horizon.',
  coordinates: ['Est. 2026', 'Multi-jurisdiction', 'Long horizon'],
  primaryCta: { label: 'Explore the company', href: EXTERNAL.about },
  secondaryCta: { label: 'Investor relations', href: EXTERNAL.ir },
} as const;

export const COMPANY = {
  folio: '§ 01',
  label: 'The Company',
  ghost: '01',
  headline: 'A holding company for foundational infrastructure.',
  paragraphs: [
    'Baalvion is a holding company for foundational infrastructure. We do not chase markets; we build the structures markets run on — the rails for trade, the systems for financial settlement, the platforms that connect institutions, and the intelligence that holds them together. Each is designed to be depended on for decades, not quarters.',
    'We operate as a foundation, not a product company. Beneath this apex sit a corporate layer, a platform layer, and a portfolio of independent brands — each governed under a single standard of discipline, permanence, and accountability. What we build is meant to outlast the conditions that created it.',
  ],
} as const;

export interface ScaleFigure {
  /** Numeric figures animate a count-up once; string figures render static. */
  value: number | string;
  suffix?: string;
  caption: string;
}

export const SCALE: {
  folio: string;
  label: string;
  ghost: string;
  caption: string;
  figures: ScaleFigure[];
} = {
  folio: '§ 02',
  label: 'Scale & Standing',
  ghost: '02',
  caption: 'Standing — as of 2026',
  figures: [
    { value: 4, caption: 'Operating domains — one coherent stack' },
    { value: 13, caption: 'Network properties under one standard' },
    { value: 6, caption: 'Operating platforms' },
    { value: 5, caption: 'Independent portfolio brands' },
    { value: 'Multi-jurisdiction', caption: 'Isolation, residency & compliance as architecture' },
    { value: 'Decades', caption: 'Held and capitalised for permanence' },
  ],
};

export interface Domain {
  id: string;
  index: string;
  title: string;
  tagline: string;
  body: string;
  manifest: string[];
}

export const DOMAINS: {
  folio: string;
  label: string;
  ghost: string;
  headline: string;
  standfirst: string;
  pillars: Domain[];
} = {
  folio: '§ 03',
  label: 'Operating Domains',
  ghost: '03',
  headline: 'Four domains. One operational fabric.',
  standfirst:
    'Each domain is an engineered system in its own right — and every one is wired back to the same core of governance, settlement, and intelligence.',
  pillars: [
    {
      id: 'trade',
      index: '01',
      title: 'Trade Infrastructure',
      tagline: 'The rails beneath global commerce.',
      body: 'Baalvion builds the systems that move goods, documents, and trust across borders. We treat trade as an engineering problem: deterministic workflows, verifiable compliance, and settlement that holds under scrutiny. The objective is not faster paperwork — it is infrastructure institutions can stake their operations on.',
      manifest: ['Customs', 'Settlement', 'Compliance', 'Logistics'],
    },
    {
      id: 'markets',
      index: '02',
      title: 'Market & Financial Systems',
      tagline: 'Settlement, ledgers, and the discipline beneath capital.',
      body: 'We design the financial machinery markets require: pricing, treasury, ledgering, and reconciliation built to institutional tolerances. Money movement is a question of correctness before convenience — every flow server-authoritative, traceable, and reconcilable to the cent.',
      manifest: ['Pricing', 'Treasury', 'Ledgering', 'Reconciliation'],
    },
    {
      id: 'ecosystem',
      index: '03',
      title: 'Ecosystem Platforms',
      tagline: 'Where institutions connect, transact, and operate.',
      body: 'Baalvion operates the platforms that bind participants into functioning ecosystems — for trade, talent, mining, and enterprise oversight. These are not destinations; they are operating environments, with identity, access, and governance built into the foundation.',
      manifest: ['Identity', 'Access', 'Operations', 'Connection'],
    },
    {
      id: 'intelligence',
      index: '04',
      title: 'Intelligence Systems',
      tagline: 'Judgment, encoded into infrastructure.',
      body: 'The systems beneath modern operation must reason, not merely record. Baalvion builds the intelligence layer — risk, compliance, classification, and optimisation — that turns operational signal into governed decisions, pairing deterministic rules with augmented analysis so judgment stays explainable and defensible.',
      manifest: ['Risk', 'Decisioning', 'Classification', 'Foresight'],
    },
  ],
};

export interface Principle {
  numeral: string;
  title: string;
  body: string;
}

export const PRINCIPLES: {
  folio: string;
  label: string;
  ghost: string;
  headline: string;
  items: Principle[];
} = {
  folio: '§ 04',
  label: 'Operating Principles',
  ghost: '04',
  headline: 'Governance is architecture.',
  items: [
    {
      numeral: 'I',
      title: 'Permanence over momentum.',
      body: 'We build for the decade, not the demo — infrastructure is judged by what it withstands, not what it promises.',
    },
    {
      numeral: 'II',
      title: 'Governance is architecture.',
      body: 'Compliance, isolation, and accountability are designed into the foundation, never bolted on after the fact.',
    },
    {
      numeral: 'III',
      title: 'Long horizons compound.',
      body: 'Capital, ownership, and decisions are held for continuity, so that patience becomes a structural advantage.',
    },
    {
      numeral: 'IV',
      title: 'Systems before features.',
      body: 'We solve for the whole — coherent, composable infrastructure outlasts any single product built upon it.',
    },
    {
      numeral: 'V',
      title: 'Discipline is the standard.',
      body: 'Restraint in scope, rigour in execution, and precision in money and trust are non-negotiable across everything we operate.',
    },
  ],
};

export const PRESENCE: {
  folio: string;
  label: string;
  ghost: string;
  headline: string;
  regions: string[];
  body: string;
} = {
  folio: '§ 05',
  label: 'Global Presence',
  ghost: '05',
  headline: 'Reach measured in jurisdictions, not pins.',
  regions: ['Americas', 'EMEA', 'APAC'],
  body: 'Baalvion is built to operate across borders, not merely to reach them. Our systems are designed for multiple jurisdictions from the foundation up — data residency, tenant isolation, regulatory regimes, and sanctions posture treated as architecture rather than configuration. The relevant measure is not how many offices carry our name, but how many regulatory regimes our infrastructure can operate within without compromise — and how cleanly each tenant, each currency, and each jurisdiction stays isolated from the next.',
};

export interface NetworkEntry {
  node: string;
  name: string;
  href: string;
  domain: string;
  description: string;
}

export interface NetworkGroup {
  key: string;
  group: string;
  note: string;
  entries: NetworkEntry[];
}

export const NETWORK: {
  folio: string;
  label: string;
  ghost: string;
  headline: string;
  intro: string;
  groups: NetworkGroup[];
} = {
  folio: '§ 06',
  label: 'The Baalvion Network',
  ghost: '06',
  headline: 'One foundation. Three layers.',
  intro:
    'Baalvion is organised in three deliberate layers. A corporate foundation sets standard, governance, and stewardship. A platform layer operates the systems institutions run on. A portfolio of independent brands extends the foundation into distinct markets — each operated at arm’s length, sharing infrastructure and discipline rather than identity.',
  groups: [
    {
      key: 'corporate',
      group: 'Corporate',
      note: 'Identity, narrative & governance',
      entries: [
        {
          node: 'C-01',
          name: 'About Baalvion',
          href: EXTERNAL.about,
          domain: 'about.baalvion.com',
          description: 'The institutional record — who Baalvion is, how it is governed, and what it is built to endure.',
        },
        {
          node: 'C-02',
          name: 'Investor Relations',
          href: EXTERNAL.ir,
          domain: 'ir.baalvion.com',
          description: 'The long-horizon thesis, for those evaluating the foundation itself.',
        },
      ],
    },
    {
      key: 'platforms',
      group: 'Platforms',
      note: 'Operating infrastructure of the network',
      entries: [
        {
          node: 'P-01',
          name: 'Global Trade',
          href: 'https://trade.baalvion.com',
          domain: 'trade.baalvion.com',
          description: 'Cross-border trade infrastructure: orchestration, customs, compliance, settlement.',
        },
        {
          node: 'P-02',
          name: 'Mining & Resources',
          href: 'https://mining.baalvion.com',
          domain: 'mining.baalvion.com',
          description: 'Resource and commodity operations infrastructure, from licensing to logistics.',
        },
        {
          node: 'P-03',
          name: 'Markets',
          href: 'https://market.baalvion.com',
          domain: 'market.baalvion.com',
          description: 'Financial and market systems: pricing, settlement, treasury at institutional tolerance.',
        },
        {
          node: 'P-04',
          name: 'Talent',
          href: 'https://jobs.baalvion.com',
          domain: 'jobs.baalvion.com',
          description: 'The connective layer for institutional talent and the workforce behind operations.',
        },
        {
          node: 'P-05',
          name: 'Connect',
          href: 'https://connect.baalvion.com',
          domain: 'connect.baalvion.com',
          description: 'Infrastructure for institutions and counterparties to find and transact with one another.',
        },
        {
          node: 'P-06',
          name: 'Enterprise Access',
          href: 'https://dashboard.baalvion.com',
          domain: 'dashboard.baalvion.com',
          description: 'The operator’s command surface: oversight, governance, and control across the stack.',
        },
      ],
    },
    {
      key: 'portfolio',
      group: 'Independent Brands',
      note: 'Autonomous brands within the portfolio',
      entries: [
        {
          node: 'B-01',
          name: 'ControlTheMarket',
          href: 'https://controlthemarket.com',
          domain: 'controlthemarket.com',
          description: 'Market intelligence and evaluation tooling, operated as an independent venture.',
        },
        {
          node: 'B-02',
          name: 'Law Elite Network',
          href: 'https://lawelitenetwork.com',
          domain: 'lawelitenetwork.com',
          description: 'A network for legal practice and institutional counsel.',
        },
        {
          node: 'B-03',
          name: 'Imperialpedia',
          href: 'https://imperialpedia.com',
          domain: 'imperialpedia.com',
          description: 'A structured knowledge platform built for depth and authority at scale.',
        },
        {
          node: 'B-04',
          name: 'Amarisé Maison Avenue',
          href: 'https://amarisemaisonavenue.com',
          domain: 'amarisemaisonavenue.com',
          description: 'A luxury maison brand, operated to its own standard within the portfolio.',
        },
        {
          node: 'B-05',
          name: 'Market Underworld',
          href: 'https://marketunderworld.com',
          domain: 'marketunderworld.com',
          description: 'A distinct market-facing brand operated independently under the foundation.',
        },
      ],
    },
  ],
};

export interface Dispatch {
  category: string;
  title: string;
  dek: string;
}

export const INSIGHT: {
  folio: string;
  label: string;
  ghost: string;
  headline: string;
  dispatches: Dispatch[];
  closing: string;
} = {
  folio: '§ 07',
  label: 'From the Foundation',
  ghost: '07',
  headline: 'Insight, written for the long horizon.',
  dispatches: [
    {
      category: 'Perspective',
      title: 'Why infrastructure outlasts the cycle.',
      dek: 'On building systems whose value is measured in continuity rather than the conditions that created them.',
    },
    {
      category: 'Governance',
      title: 'Governance as architecture, not aftermath.',
      dek: 'How isolation, traceability, and accountability are designed into a system from the first commit.',
    },
    {
      category: 'Thesis',
      title: 'The long-horizon case for the foundation.',
      dek: 'Why permanence, patient capital, and disciplined ownership compound where momentum cannot.',
    },
  ],
  closing: 'Read the institutional perspective at about.baalvion.com and the long-horizon thesis at ir.baalvion.com.',
};

export const CLOSING = {
  folio: '§ 08',
  label: 'Orientation',
  headline: 'Built to be depended on',
  body: 'Baalvion is the foundation beneath a multi-domain operating group — infrastructure designed for permanence, governed for trust, and held for the long horizon. Whether you are evaluating the foundation, partnering across a platform, or studying how it is governed, the institutional record begins here.',
  primaryCta: { label: 'Explore the company', href: EXTERNAL.about },
  secondaryCta: { label: 'Investor relations', href: EXTERNAL.ir },
} as const;

export const FOOTER = {
  statement: 'Global infrastructure intelligence. Engineered for permanence, governed for trust, held for the long horizon.',
  charter: 'Baalvion · A multi-jurisdiction holding company for foundational infrastructure',
  columns: [
    {
      title: 'Company',
      links: [
        { label: 'About', href: ROUTES.about },
        { label: 'Platform & Services', href: ROUTES.services },
        { label: 'The Network', href: '/#network' },
        { label: 'Investor Relations', href: EXTERNAL.ir },
      ],
    },
    {
      title: 'Account',
      links: [
        { label: 'Sign in', href: ROUTES.signin },
        { label: 'Create account', href: ROUTES.register },
        { label: 'Account recovery', href: ROUTES.recovery },
        { label: 'Email communications', href: ROUTES.email },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Contact', href: ROUTES.contact },
        { label: 'Security', href: ROUTES.security },
        { label: 'Status', href: ROUTES.contact },
        { label: 'support@baalvion.com', href: `mailto:${CONTACT.support}` },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy', href: ROUTES.privacy },
        { label: 'Terms of Service', href: ROUTES.terms },
        { label: 'Cookie Policy', href: ROUTES.cookies },
        { label: 'Acceptable Use', href: ROUTES.acceptableUse },
        { label: 'Data Protection', href: ROUTES.dataProtection },
      ],
    },
  ],
} as const;
