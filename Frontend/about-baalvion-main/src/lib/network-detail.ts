/**
 * Deep, per-property documentation for entries in the Network registry
 * (see src/lib/network.ts). Every field here is sourced from that property's
 * own repository README or its live, public copy — quoted/adapted, never
 * invented. Only properties with a real, reviewed detail page appear here;
 * an entry in NETWORK_ENTRIES without a match here has no /network/[slug]
 * page yet and only links out to its live domain.
 */

export interface ArchitectureNode {
  id: string;
  label: string;
  detail: string;
}

export interface ArchitectureDiagram {
  /** The single entry point every request starts from. */
  root: ArchitectureNode;
  /** Services reached from the root, each gated by `gate` below. */
  gated: ArchitectureNode[];
  /** The shared session/security layer every gated service passes through. */
  gate: ArchitectureNode;
  /** Reached directly from the root, not through the gate. */
  standalone: ArchitectureNode[];
}

export interface NetworkDetail {
  slug: string;
  eyebrow: string;
  headline: string;
  problemLabel: string;
  problem: string;
  solutionLabel: string;
  solution: string;
  architecture: ArchitectureDiagram;
  capabilities: { name: string; description: string }[];
  gallery: { src: string; width: number; height: number; alt: string; caption: string }[];
  stack: string[];
  faqs: { q: string; a: string }[];
  sourceNote: string;
}

export const NETWORK_DETAILS: Record<string, NetworkDetail> = {
  'global-trade-infrastructure': {
    slug: 'global-trade-infrastructure',
    eyebrow: 'Platform Profile',
    headline: 'An institutional-grade operating system for global trade',
    problemLabel: 'The problem',
    problem:
      'Global trade operates across disconnected systems. Contracts, payments, compliance checks, and shipments are managed in isolation — creating delays, risk, and inefficiency for every institution that touches a cross-border deal.',
    solutionLabel: 'What Global Trade Infrastructure does',
    solution:
      'Baalvion GTI is a unified digital infrastructure that serves as the operating system for global trade — connecting trade execution, finance, compliance, and logistics within a single governed platform, so every participant works from one trusted, shared source of truth. It pairs a public marketing and onboarding surface for banks, governments, enterprises, and logistics providers with an authenticated trade-operations control center: sourcing and RFQs, deals and orders, escrow-secured payments, trade finance, compliance and sanctions screening, customs, logistics and shipment tracking, intelligence, and a sovereign governance plane.',
    architecture: {
      root: {
        id: 'browser',
        label: 'Browser',
        detail: 'Next.js 15 · trade.baalvion.com',
      },
      gated: [
        {
          id: 'auth',
          label: 'Auth Gateway',
          detail: 'login · register · refresh · logout · session',
        },
        {
          id: 'trade',
          label: 'Trade Service',
          detail: 'sourcing · RFQs · deals · orders · escrow · customs',
        },
        {
          id: 'finance',
          label: 'Financial Services (Java)',
          detail: 'trade finance · settlement',
        },
      ],
      gate: {
        id: 'session',
        label: 'Session Plane',
        detail: 'httpOnly access/refresh cookies · RS256 + Redis · tenant + identity headers',
      },
      standalone: [
        {
          id: 'orchestrator',
          label: 'Orchestration Backend',
          detail: 'in-app route handlers · Prisma / Postgres · event store',
        },
      ],
    },
    capabilities: [
      {
        name: 'Verified onboarding',
        description:
          'No anonymous buyers, no unverified sellers — KYC is the foundation that lets billion-dollar trades happen between strangers. Separate verification paths for buyers, sellers, and institutional departments.',
      },
      {
        name: 'Sourcing & RFQs',
        description: 'Buyers source verified suppliers and send RFQs; sellers reach global buyers and respond to RFQs.',
      },
      {
        name: 'Escrow-secured payments & trade finance',
        description: 'Payments and financing run through escrow and a dedicated financial-services layer, not ad hoc invoicing.',
      },
      {
        name: 'Compliance & sanctions screening',
        description: 'Customs and sanctions screening are built into the trade flow rather than handled outside it.',
      },
      {
        name: 'Logistics & shipment tracking',
        description: 'Shipment and logistics tracking, backed by a routing engine across a seeded network of 388 real ports.',
      },
      {
        name: 'World Shipping Directory',
        description:
          'A public reference registry of merchant and state-operated vessels keyed on IMO number, and the companies that operate them — served on its own subdomain, ships.baalvion.com.',
      },
      {
        name: 'Sovereign governance plane',
        description: 'A dedicated, persona-gated oversight tree for institutional and regulatory administration.',
      },
    ],
    gallery: [
      {
        src: '/network/global-trade-infrastructure.png',
        width: 1600,
        height: 1000,
        alt: 'Global Trade Infrastructure homepage at trade.baalvion.com',
        caption: 'trade.baalvion.com — public homepage',
      },
      {
        src: '/network/gti/platform-overview.png',
        width: 1600,
        height: 1000,
        alt: 'The Baalvion Platform overview page describing the institutional operating system for global trade',
        caption: '/platform — the institutional pitch',
      },
      {
        src: '/network/gti/onboarding-kyc.png',
        width: 1600,
        height: 1000,
        alt: 'Baalvion onboarding flow showing separate KYC verification paths for buyers and sellers',
        caption: '/onboard — verified buyer/seller onboarding',
      },
      {
        src: '/network/ships.baalvion.com.png',
        width: 1600,
        height: 1000,
        alt: 'World Shipping Directory homepage at ships.baalvion.com',
        caption: 'ships.baalvion.com — the public shipping directory',
      },
    ],
    stack: ['Next.js 15', 'React 18', 'TypeScript', 'Tailwind CSS', 'TanStack Query', 'Prisma', 'Vitest', 'Playwright'],
    faqs: [
      {
        q: 'Is Global Trade Infrastructure live?',
        a: 'Yes — the public marketing and onboarding surface is live at trade.baalvion.com, alongside the authenticated trade-operations control center for verified buyers, sellers, and institutions.',
      },
      {
        q: 'Who is it built for?',
        a: 'Enterprises, banks, government and customs authorities, and logistics carriers transacting cross-border trade.',
      },
      {
        q: 'How does the shipping directory relate to the trade platform?',
        a: 'World Shipping Directory (ships.baalvion.com) is part of Global Trade Infrastructure, published on its own subdomain as a public reference registry of vessels and the companies that operate them.',
      },
    ],
    sourceNote:
      'Sourced from the Global-Trade-Infrastructure-main repository README and the live public pages at trade.baalvion.com and ships.baalvion.com.',
  },
};

export function getNetworkDetail(slug: string): NetworkDetail | null {
  return NETWORK_DETAILS[slug] ?? null;
}
