/**
 * Deep, per-property documentation for entries in the Network registry
 * (see src/lib/network.ts). Every field here is sourced from that property's
 * own repository README, its own source code, or its live public copy —
 * quoted/adapted, never invented. Only properties with a real, reviewed
 * detail page appear here; an entry in NETWORK_ENTRIES without a match here
 * has no /network/[slug] page yet and only links out to its live domain.
 */

export interface ArchitectureNode {
  id: string;
  label: string;
  detail: string;
  /** Highlights this node as the shared session/security/data layer. */
  emphasis?: boolean;
}

export interface ArchitectureStage {
  /** Optional caption above this row, e.g. "Session-gated" or "Optional, server-only". */
  label?: string;
  nodes: ArchitectureNode[];
}

export interface ArchitectureDiagram {
  /** e.g. "Request architecture" for a live app, "Build & deploy pipeline" for a static export. */
  heading: string;
  intro: string;
  /** Rendered top to bottom, with a connector between each row. */
  stages: ArchitectureStage[];
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
  // ---- Corporate ----------------------------------------------------------
  baalvion: {
    slug: 'baalvion',
    eyebrow: 'Platform Profile',
    headline: 'The flagship corporate identity hub',
    problemLabel: 'What it is',
    problem:
      'A holding company with a portfolio of platforms and independent brands needs one strictly corporate page that indexes the whole network — without becoming another product surface with its own auth, dashboards, or backend to maintain.',
    solutionLabel: 'How baalvion.com solves it',
    solution:
      'Baalvion.com is a single corporate page assembled entirely from section components and statically exported — zero auth, no dashboards, no backend logic. Every fact on the page (the domains, the layers, the brands) is read from one TypeScript file, so the page can never drift from what is actually true elsewhere on the network.',
    architecture: {
      heading: 'How it’s built',
      intro:
        'There is no request topology here on purpose — it is a static export with no backend calls, served from the edge.',
      stages: [
        { nodes: [{ id: 'content', label: 'content.ts', detail: 'single source of truth for all corporate copy' }] },
        { nodes: [{ id: 'page', label: 'page.tsx', detail: 'hero → company → domains → network → closing' }] },
        { nodes: [{ id: 'export', label: 'next build', detail: "output: 'export' → static HTML in /out" }] },
        {
          nodes: [
            { id: 'cf', label: 'Cloudflare Workers', detail: 'static assets · security headers via public/_headers', emphasis: true },
          ],
        },
        { nodes: [{ id: 'visitor', label: 'Visitor / crawler', detail: 'no cookies, no client-side auth state' }] },
      ],
    },
    capabilities: [
      { name: 'Company & governance narrative', description: 'The institutional pitch, the challenge Baalvion addresses, and how it is governed across jurisdictions.' },
      { name: 'Services overview', description: 'Trade infrastructure, market & financial systems, ecosystem platforms, and intelligence systems, each summarized and linked out.' },
      { name: 'Solutions by audience', description: 'Distinct entry points for enterprises, financial institutions, governments & regulators, partners, and investors.' },
      { name: 'Trust center', description: 'Security, governance, reliability, and legal & policy pages in one place.' },
      { name: 'The Network directory', description: 'The corporate, platform, and independent-brand layers of the portfolio, each with its real domain.' },
    ],
    gallery: [],
    stack: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'Cloudflare Workers', 'pnpm'],
    faqs: [
      { q: 'Does baalvion.com have its own login or dashboards?', a: 'No — it is intentionally a strictly corporate, statically-exported site: zero auth, no dashboards, no backend logic.' },
      { q: 'Where does its content come from?', a: 'From one TypeScript file (src/lib/content.ts) acting as the single source of truth, not a CMS.' },
      { q: 'Is it indexed by search engines?', a: 'Yes — robots is set to index + follow, with a generated sitemap, Organization JSON-LD, and an OpenGraph image generated via next/og.' },
    ],
    sourceNote: 'Sourced from the baalvion-com-main repository README and src/lib/content.ts.',
  },

  'investor-relations': {
    slug: 'investor-relations',
    eyebrow: 'Platform Profile',
    headline: 'The institutional investor relations portal',
    problemLabel: 'What it is',
    problem:
      'Investors evaluating a long-horizon infrastructure company need the investment thesis, governance framework, and financials to be crawlable and citable — while the data room and capital operations behind them stay strictly access-controlled.',
    solutionLabel: 'How Investor Relations solves it',
    solution:
      'The public IR and marketing pages (why invest, investment thesis, market opportunity, use of proceeds, financials, governance framework, FAQ) are server-rendered from a code-defined source of truth, so every page is crawler-friendly on its own URL. The home page and the gated investor portal — dashboard, data room, capital ops, strategic operator tools, and governance voting — are separate, session-gated client surfaces layered on top.',
    architecture: {
      heading: 'Request architecture',
      intro: 'Two content sources feed one renderer: code-defined IR pages for SEO, and the central CMS for the home experience.',
      stages: [
        {
          label: 'Two content sources',
          nodes: [
            { id: 'ssot', label: 'IR_PAGES (code SSOT)', detail: 'src/lib/ir-pages.ts — drives crawlable IR routes' },
            { id: 'cms', label: 'Central Baalvion CMS', detail: 'cms-service / admin-platform console' },
          ],
        },
        {
          nodes: [
            { id: 'ssr', label: 'IrPage(slug) → getIrPage()', detail: 'generates metadata + JSON-LD per route' },
            { id: 'bff', label: '/api/cms/pages · /api/cms/navigation', detail: 'same-origin BFF, force-dynamic' },
          ],
        },
        {
          nodes: [
            { id: 'renderer', label: 'PageRenderer', detail: 'COMPONENT_REGISTRY[section.type]', emphasis: true },
          ],
        },
        {
          label: 'Session-gated investor portal',
          nodes: [
            { id: 'portal', label: 'Investor Portal', detail: '/dashboard · /data-room · /capital-ops · /governance/my-voting' },
          ],
        },
      ],
    },
    capabilities: [
      { name: 'The investment thesis', description: 'Why invest, market opportunity, and use of proceeds, each on its own crawlable, SEO-owned route.' },
      { name: 'Financials & governance', description: 'Public financials and a governance framework page, alongside FAQ and resources.' },
      { name: 'Investor portal', description: 'A session-gated dashboard, data room, and capital-ops workspace for verified investors.' },
      { name: 'Governance voting', description: 'A dedicated governance/my-voting surface inside the gated portal.' },
    ],
    gallery: [],
    stack: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'pnpm'],
    faqs: [
      { q: 'Is the investor portal public?', a: 'No — the dashboard, data room, and capital-ops tools are session-gated behind the central Baalvion identity platform.' },
      { q: 'Why does every route render dynamically?', a: 'The root layout sets force-dynamic with no revalidation, so content edited in the central CMS console is reflected on the very next request.' },
    ],
    sourceNote: 'Sourced from the IR-Baalvion-main repository README.',
  },

  // ---- Platforms ------------------------------------------------------------
  'world-shipping-directory': {
    slug: 'world-shipping-directory',
    eyebrow: 'Platform Profile',
    headline: 'A public, sourced registry of the world’s ships',
    problemLabel: 'What it is',
    problem:
      'Anyone researching a vessel or its operator — a fleet, its tonnage, its flag state — usually has to stitch that together from scattered, unsourced listings.',
    solutionLabel: 'How World Shipping Directory solves it',
    solution:
      'A reference registry of merchant and state-operated vessels keyed on IMO number, and of the companies that own and operate them — founders, leadership, fleets, tonnage, flag states, and published capacity rankings, every figure with its source. It is part of Global Trade Infrastructure, served on its own public subdomain, with the internal path rewritten so every page has exactly one canonical address.',
    architecture: {
      heading: 'Request architecture',
      intro: 'The public host is a thin, canonical alias in front of the same GTI application and trade-service backend.',
      stages: [
        { nodes: [{ id: 'browser', label: 'Browser', detail: 'ships.baalvion.com — the public canonical host' }] },
        { nodes: [{ id: 'rewrite', label: 'Middleware rewrite', detail: 'maps to the internal /shipping-directory path — one address per page' }] },
        {
          nodes: [
            { id: 'trade', label: 'trade-service', detail: '/v1/public/shipping — ISR-cached, revalidated on an interval', emphasis: true },
          ],
        },
      ],
    },
    capabilities: [
      { name: 'Vessel profiles', description: 'Keyed on IMO number, with type, tonnage, flag state, and build year.' },
      { name: 'Company & fleet profiles', description: 'Founders, leadership, and fleet composition for the operators behind the vessels.' },
      { name: 'Cohort rankings', description: 'Flag-state and vessel-type cross-cuts with peer rank, backed by real counts.' },
      { name: 'Honest empty states', description: 'If the registry is unreachable the page shows an explicit empty state — it never invents rows.' },
    ],
    gallery: [],
    stack: ['Next.js 15', 'React 18', 'TypeScript', 'Tailwind CSS'],
    faqs: [
      { q: 'How is ships.baalvion.com related to trade.baalvion.com?', a: 'It is the same Global Trade Infrastructure application, served on its own subdomain via a middleware rewrite, so there is one canonical address per page.' },
      { q: 'Where does the vessel and company data come from?', a: 'trade-service’s public shipping registry API. If it is unreachable, the page renders an explicit empty state rather than fabricating data.' },
    ],
    sourceNote: 'Sourced from the Global-Trade-Infrastructure-main repository (src/lib/shipping-directory) and the live site at ships.baalvion.com.',
  },

  talentos: {
    slug: 'talentos',
    eyebrow: 'Platform Profile',
    headline: 'One application, one dashboard, one Candidate ID',
    problemLabel: 'What it is',
    problem:
      'Hiring across engineering, mining, media, and operations roles in one country and worldwide usually means a different application flow and a different account for every posting.',
    solutionLabel: 'How TalentOS solves it',
    solution:
      'TalentOS pairs a public, SEO-first careers site with a full applicant-tracking-system console and a candidate self-service portal in one Next.js app — one application, one dashboard, one Candidate ID, backed by the central Baalvion platform.',
    architecture: {
      heading: 'Request architecture',
      intro: 'The UI never calls the backend directly — every request funnels through a typed service-adapter layer.',
      stages: [
        { nodes: [{ id: 'ui', label: 'React component / page', detail: '' }] },
        { nodes: [{ id: 'svc', label: 'Service façades', detail: 'src/services/*.service.ts' }] },
        { nodes: [{ id: 'adapter', label: 'Service Adapter', detail: 'serverAdapter — the only production adapter; the mock branch is retired', emphasis: true }] },
        { nodes: [{ id: 'gateway', label: 'Baalvion API gateway', detail: '' }] },
        {
          label: 'Backed by',
          nodes: [
            { id: 'jobs', label: 'jobs-service', detail: 'ecosystem domain' },
            { id: 'auth', label: 'auth-service', detail: 'identity domain' },
          ],
        },
      ],
    },
    capabilities: [
      { name: 'Public careers site', description: 'SEO-optimized job listings and a multi-step application flow, server-rendered for search.' },
      { name: 'ATS console', description: 'The authenticated hiring workspace: dashboard, jobs, candidates, interviews, offers, campus, settings, RBAC, and audit.' },
      { name: 'Candidate self-service', description: 'A signed-in candidate area for tracking applications under one Candidate ID.' },
      { name: 'Contractor project dashboards', description: 'A separate marketplace-style project and milestone tracker for clients and contractors.' },
      { name: 'Live sitemap', description: 'The sitemap merges static routes with live published jobs and countries fetched from the backend.' },
    ],
    gallery: [],
    stack: ['Next.js 15', 'React 18', 'TypeScript', 'Tailwind CSS', 'Zustand', 'SWR'],
    faqs: [
      { q: 'Is any part of the hiring flow mocked in production?', a: 'No — the legacy mock adapter has been retired; the real backend adapter is the only one shipped.' },
      { q: 'What roles does it hire for?', a: 'Engineering, mining, media, and operations roles across India and worldwide, per the site’s own careers copy.' },
    ],
    sourceNote: 'Sourced from the Baalvion-Jobs-Portal-main repository README and the live site at jobs.baalvion.com.',
  },

  'baalvion-intelligence': {
    slug: 'baalvion-intelligence',
    eyebrow: 'Platform Profile',
    headline: 'A news API built for AI agents and businesses',
    problemLabel: 'What it is',
    problem:
      'Monitoring companies, competitors, industries, and world events in real time usually means stitching together multiple feeds by hand — with no single, queryable, developer-facing source.',
    solutionLabel: 'How Baalvion Intelligence solves it',
    solution:
      'Real-time global news intelligence with AI-powered summaries, trends, sentiment, and alerts, exposed as a documented API for AI agents and businesses, alongside a self-serve dashboard for people who want the same intelligence without writing code.',
    architecture: {
      heading: 'Request architecture',
      intro: 'Session, news data, and developer tooling are three separate concerns, each proxied to its own backend.',
      stages: [
        { nodes: [{ id: 'browser', label: 'Browser', detail: 'Next.js 15 — signal.baalvion.com' }] },
        { nodes: [{ id: 'session', label: 'Auth Gateway', detail: '/auth-bff/* rewrite — httpOnly cookie session', emphasis: true }] },
        {
          label: 'Data & developer APIs',
          nodes: [
            { id: 'news', label: 'news-service', detail: 'NEWS_SERVICE_URL — server-side only, API-key authenticated' },
            { id: 'dev', label: 'developer-service', detail: 'DEVELOPER_SERVICE_URL — API keys, usage, quota' },
          ],
        },
        { label: 'Billing', nodes: [{ id: 'razorpay', label: 'Razorpay checkout', detail: 'plan-based billing' }] },
      ],
    },
    capabilities: [
      { name: 'Real-time monitoring', description: 'Companies, competitors, industries, and world events tracked with AI-powered summaries, trends, sentiment, and alerts.' },
      { name: 'Developer API', description: 'A documented news API with API keys, usage tracking, and plan-based quotas.' },
      { name: 'Self-serve dashboard', description: 'Overview, entity explorer, trends, alerts, API keys, usage, and billing in one authenticated workspace.' },
      { name: 'Public docs', description: 'A marketing-and-docs surface for evaluating the product before signing up.' },
    ],
    gallery: [],
    stack: ['Next.js 15', 'React 19', 'TypeScript'],
    faqs: [
      { q: 'Who is Baalvion Intelligence built for?', a: 'AI agents and businesses that need a queryable news API, plus a self-serve dashboard for people who want the same intelligence directly.' },
      { q: 'How is API access controlled?', a: 'Through API keys with plan-based quotas; billing runs through Razorpay checkout.' },
    ],
    sourceNote: 'Sourced from the baalvion-intelligence repository source (no public README yet) and the live site at signal.baalvion.com.',
  },

  // ---- Independent Brands ---------------------------------------------------
  controlthemarket: {
    slug: 'controlthemarket',
    eyebrow: 'Independent Brand Profile',
    headline: 'Hire by skill, not by resume',
    problemLabel: 'What it is',
    problem:
      'Resumes are a poor proxy for whether someone can actually do the job — companies need a way to see real-world performance before they hire.',
    solutionLabel: 'How ControlTheMarket solves it',
    solution:
      'A proof-of-skill hiring platform: companies discover verified talent through real-world task performance, not resumes, operated as an independent brand within the Baalvion portfolio on its own domain.',
    architecture: {
      heading: 'Request architecture',
      intro: 'Public surfaces render server-side for SEO; the gated candidate, company, and admin workspaces are client-rendered behind the auth context.',
      stages: [
        { nodes: [{ id: 'visitor', label: 'Candidate · Company · Admin', detail: '' }] },
        { nodes: [{ id: 'app', label: 'ControlTheMarket Web', detail: 'Next.js 15' }] },
        {
          nodes: [
            { id: 'ctm', label: 'ctm service', detail: 'tasks · submissions · evaluations · rankings' },
            { id: 'gw', label: 'Auth Gateway · BFF', detail: 'httpOnly refresh cookie, single-flight refresh', emphasis: true },
          ],
        },
        { label: 'Server-only, optional', nodes: [{ id: 'ai', label: 'Genkit AI flows', detail: 'kept out of the client bundle' }] },
      ],
    },
    capabilities: [
      { name: 'Real-world task evaluation', description: 'Candidates complete tasks that are submitted, evaluated, and ranked — not just reviewed as a profile.' },
      { name: 'Ranking engine', description: 'A dedicated engine computes candidate rankings and badges from evaluated performance.' },
      { name: 'Three workspaces', description: 'Separate candidate, company, and admin experiences, each gated behind the auth context.' },
      { name: 'Honest local-dev fallback', description: 'A hybrid data layer merges live API results with bundled mock data only in local development; production always disables the mock path.' },
    ],
    gallery: [],
    stack: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'Docker', 'pnpm'],
    faqs: [
      { q: 'How are candidates ranked?', a: 'By a dedicated ranking engine that scores real-world task performance, not resume content.' },
      { q: 'Is production data ever mocked?', a: 'No — the hybrid data/mock layer is a local-development convenience only; production sets NEXT_PUBLIC_USE_MOCK=false.' },
    ],
    sourceNote: 'Sourced from the controlthemarket-main repository README and the live site at controlthemarket.com.',
  },

  'law-elite-network': {
    slug: 'law-elite-network',
    eyebrow: 'Independent Brand Profile',
    headline: 'Plain-language legal guides, worldwide',
    problemLabel: 'What it is',
    problem:
      'Finding a lawyer, understanding your legal options, and booking a consultation is often opaque — buried in jargon or gated behind a phone call.',
    solutionLabel: 'How Law Elite Network solves it',
    solution:
      'A legal knowledge and practitioner-discovery surface — plain-language legal guides worldwide, finding lawyers, booking consultations, and managing cases, backed by the central law-service and Baalvion identity.',
    architecture: {
      heading: 'Request architecture',
      intro: 'Public knowledge and directory routes are server-rendered for SEO; interactive surfaces are client islands.',
      stages: [
        { nodes: [{ id: 'visitor', label: 'Visitor · client · lawyer', detail: '' }] },
        { nodes: [{ id: 'app', label: 'Law Elite Web', detail: 'Next.js 15' }] },
        {
          nodes: [
            { id: 'auth', label: 'auth-service', detail: 'sets refresh / CSRF cookie', emphasis: true },
            { id: 'law', label: 'law-service', detail: 'lawyers · cases · bookings · articles · payments' },
            { id: 'seo', label: 'SEO infra', detail: 'sitemap.ts / robots.ts — lawyer, article, category URLs' },
          ],
        },
      ],
    },
    capabilities: [
      { name: 'Lawyer discovery', description: 'Finding lawyers, booking consultations, and managing cases through law-service.' },
      { name: 'Legal education content', description: 'Plain-language guides and articles, server-rendered for search.' },
      { name: 'Bookings, cases & payments', description: 'An authenticated API client covers bookings, cases, messages, documents, and payments.' },
      { name: 'Chat assistant (rule-based today)', description: 'A rule-based intent-matching engine handles the chat assistant and recommendations; the Genkit/Google-GenAI integration exists in the codebase but its flow harness is currently an empty stub — not yet generative AI in production.' },
    ],
    gallery: [],
    stack: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'Zustand', 'Algolia'],
    faqs: [
      { q: 'Is the chat assistant powered by generative AI?', a: 'Not yet — today it is a rule-based intent-matching engine. The Genkit/Google-GenAI integration is present in the codebase but its flow harness is currently an empty stub.' },
      { q: 'How do bookings and payments work?', a: 'Through law-service, behind an authenticated API client covering bookings, cases, messages, documents, and payments.' },
    ],
    sourceNote: 'Sourced from the Law-Elite-Network-main repository README and the live site at lawelitenetwork.com.',
  },

  imperialpedia: {
    slug: 'imperialpedia',
    eyebrow: 'Independent Brand Profile',
    headline: 'Financial knowledge, built for scale',
    problemLabel: 'What it is',
    problem:
      'Understanding a company, an industry, or a piece of financial terminology usually means piecing it together from several different, inconsistent sources.',
    solutionLabel: 'How Imperialpedia solves it',
    solution:
      'An Investopedia-style encyclopedia, newsroom, and knowledge graph — companies, countries, industries, technologies, and a glossary — plus financial calculators, review boards, and an optional AI-Analyst suite, server-rendered for large-scale search and AI crawlability.',
    architecture: {
      heading: 'Request architecture',
      intro: 'Two live backends feed the site, with a static fallback so a page is never blank.',
      stages: [
        { nodes: [{ id: 'reader', label: 'Reader · analyst · crawler', detail: '' }] },
        { nodes: [{ id: 'app', label: 'Imperialpedia Web', detail: 'Next.js 15' }] },
        {
          nodes: [
            { id: 'cms', label: 'cms-service', detail: 'published editorial content' },
            { id: 'is', label: 'imperialpedia-service', detail: 'structured knowledge entities', emphasis: true },
            { id: 'gw', label: 'Auth Gateway · BFF', detail: 'httpOnly refresh cookie' },
          ],
        },
        {
          label: 'Fallback / optional',
          nodes: [
            { id: 'static', label: 'Bundled static JSON', detail: 'used only when the CMS/backend is empty or unreachable' },
            { id: 'ai', label: 'Genkit AI flows', detail: 'optional — requires GEMINI_API_KEY, else templated fallback' },
          ],
        },
      ],
    },
    capabilities: [
      { name: 'Knowledge graph', description: 'Structured company, country, industry, and technology entities, plus a glossary.' },
      { name: 'Newsroom & editorial', description: 'Articles and news authored in admin-platform, published through the CMS.' },
      { name: 'Financial calculators & review boards', description: 'Interactive tools and editorial review workflows alongside the reference content.' },
      { name: 'Never blank', description: 'When the CMS or backend is empty or unreachable, pages fall back to bundled static data rather than failing.' },
      { name: 'Publish-time indexing', description: 'Publishing triggers an IndexNow ping and targeted path revalidation.' },
    ],
    gallery: [],
    stack: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'TanStack Query', 'Vitest'],
    faqs: [
      { q: 'What happens if the CMS or backend is unreachable?', a: 'Pages fall back to bundled static JSON (or a legacy mock set) so nothing renders blank; real content resumes once the source is reachable again.' },
      { q: 'Is the AI-Analyst suite always on?', a: 'No — it requires a GEMINI_API_KEY. Without one, a templated fallback is used instead of a live model.' },
    ],
    sourceNote: 'Sourced from the Imperialpedia-main repository README and the live site at imperialpedia.com.',
  },

  'amarise-maison-avenue': {
    slug: 'amarise-maison-avenue',
    eyebrow: 'Independent Brand Profile',
    headline: 'A multi-market maison storefront',
    problemLabel: 'What it is',
    problem:
      'A luxury storefront selling across several countries needs correct locale, currency, and payment handling per market — not a single generic checkout bolted onto every region.',
    solutionLabel: 'How Amarisé Maison Avenue solves it',
    solution:
      'A multi-market, SEO-rich commerce experience for haute couture, fine watches, and jewelry, served as a thin presentation tier over the shared Baalvion commerce backend — five markets, each with its own URL segment, locale, and payment processor.',
    architecture: {
      heading: 'Request architecture',
      intro: 'A thin storefront in front of the shared commerce backend — no local database.',
      stages: [
        { nodes: [{ id: 'browser', label: 'Browser', detail: 'Amarisé — Next.js 15' }] },
        {
          nodes: [
            { id: 'commerce', label: 'commerce-service', detail: 'products · categories · markets — ISR, 60s revalidation' },
            { id: 'order', label: 'order-service', detail: 'orders, server-priced payments' },
            { id: 'inventory', label: 'inventory-service', detail: '' },
          ],
        },
        { nodes: [{ id: 'gateway', label: 'Identity gateway', detail: '/auth-bff — httpOnly refresh cookie', emphasis: true }] },
        { label: 'Payments', nodes: [{ id: 'psp', label: 'Razorpay · Stripe.js · PayU', detail: 'region-appropriate processor per market' }] },
      ],
    },
    capabilities: [
      { name: 'Five markets, one storefront', description: 'US, UK, UAE, India, and Singapore, each under its own /[country] URL segment.' },
      { name: 'Locale-aware routing', description: 'Middleware resolves the visitor’s market from cookie → Accept-Language → default, including right-to-left layout for the UAE.' },
      { name: 'Fresh catalog data', description: 'Products and categories are server-fetched with a 60-second ISR window, not client-polled.' },
      { name: 'Gated accounts', description: 'Every /[country]/account/* route is protected behind the httpOnly refresh cookie.' },
    ],
    gallery: [],
    stack: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'Three.js', 'Framer Motion'],
    faqs: [
      { q: 'Does the storefront support multiple countries?', a: 'Yes — five markets (US, UK, UAE, India, Singapore), each with its own URL segment, locale, and, for the UAE, a right-to-left layout.' },
      { q: 'How fresh is the product catalog?', a: 'It is server-fetched with a 60-second ISR revalidation window rather than being polled client-side.' },
    ],
    sourceNote: 'Sourced from the AmariseMaisonAvenue-main repository README and the live site at amarisemaisonavenue.com.',
  },

  'baalvion-insiders': {
    slug: 'baalvion-insiders',
    eyebrow: 'Independent Brand Profile',
    headline: 'A private network for investors & founders',
    problemLabel: 'What it is',
    problem:
      'High-value deal flow and founder-investor introductions usually happen in closed circles with no shared, verified place to meet.',
    solutionLabel: 'How Baalvion Insiders solves it',
    solution:
      'An invite-only, verified network — investors and founders access curated deal flow and high-value discussions, connecting with other investors, founders, and operators. It runs on the same commerce, community, and gift-card services used elsewhere on the Baalvion platform.',
    architecture: {
      heading: 'Request architecture',
      intro: 'A proxy layer in front of the same shared commerce and community services used elsewhere on the platform.',
      stages: [
        { nodes: [{ id: 'browser', label: 'Browser', detail: 'Baalvion Insiders — Next.js 15' }] },
        {
          nodes: [
            { id: 'commerce', label: 'commerce-service', detail: 'via /api/commerce-proxy' },
            { id: 'community', label: 'community-service', detail: 'via /api/community-proxy' },
            { id: 'giftcard', label: 'giftcard-service', detail: 'via /api/giftcard-proxy' },
          ],
        },
        {
          label: 'Session & realtime',
          nodes: [
            { id: 'oauth', label: 'oauth-bridge', detail: 'session', emphasis: true },
            { id: 'realtime', label: 'realtime-token', detail: 'community chat' },
          ],
        },
      ],
    },
    capabilities: [
      { name: 'Verified, invite-only access', description: 'New members apply for access and go through verification before joining.' },
      { name: 'Curated deal flow', description: 'High-value discussions and deal flow shared with verified members.' },
      { name: 'Shared platform infrastructure', description: 'Runs on the same real commerce, community, and gift-card services used elsewhere on the Baalvion platform, rather than a bespoke backend.' },
    ],
    gallery: [],
    stack: ['Next.js 15', 'React 19', 'TypeScript'],
    faqs: [
      { q: 'Is Baalvion Insiders open to the public?', a: 'No — it is invite-only. Visitors apply for access and are verified before joining.' },
      { q: 'What is "Market Underworld"?', a: 'That is this property’s internal repository codename. The live product presents itself to visitors as Baalvion Insiders.' },
    ],
    sourceNote: 'Sourced from the market-underworld repository source and the live site at marketunderworld.com.',
  },

  // ---- Global Trade Infrastructure (pilot) ----------------------------------
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
      heading: 'Request architecture',
      intro: 'The browser talks to a single origin. Every trade and finance call is proxied through the central auth-gateway with signed identity and tenant headers — this app never holds a bearer token in JavaScript.',
      stages: [
        { nodes: [{ id: 'browser', label: 'Browser', detail: 'Next.js 15 · trade.baalvion.com' }] },
        {
          nodes: [
            { id: 'auth', label: 'Auth Gateway', detail: 'login · register · refresh · logout · session' },
            { id: 'trade', label: 'Trade Service', detail: 'sourcing · RFQs · deals · orders · escrow · customs' },
            { id: 'finance', label: 'Financial Services (Java)', detail: 'trade finance · settlement' },
          ],
        },
        {
          nodes: [
            { id: 'session', label: 'Session Plane', detail: 'httpOnly access/refresh cookies · RS256 + Redis · tenant + identity headers', emphasis: true },
          ],
        },
        {
          label: 'Also reached directly from the browser',
          nodes: [{ id: 'orchestrator', label: 'Orchestration Backend', detail: 'in-app route handlers · Prisma / Postgres · event store' }],
        },
      ],
    },
    capabilities: [
      { name: 'Verified onboarding', description: 'No anonymous buyers, no unverified sellers — KYC is the foundation that lets billion-dollar trades happen between strangers. Separate verification paths for buyers, sellers, and institutional departments.' },
      { name: 'Sourcing & RFQs', description: 'Buyers source verified suppliers and send RFQs; sellers reach global buyers and respond to RFQs.' },
      { name: 'Escrow-secured payments & trade finance', description: 'Payments and financing run through escrow and a dedicated financial-services layer, not ad hoc invoicing.' },
      { name: 'Compliance & sanctions screening', description: 'Customs and sanctions screening are built into the trade flow rather than handled outside it.' },
      { name: 'Logistics & shipment tracking', description: 'Shipment and logistics tracking, backed by a routing engine across a seeded network of 388 real ports.' },
      { name: 'World Shipping Directory', description: 'A public reference registry of merchant and state-operated vessels keyed on IMO number, and the companies that operate them — served on its own subdomain, ships.baalvion.com.' },
      { name: 'Sovereign governance plane', description: 'A dedicated, persona-gated oversight tree for institutional and regulatory administration.' },
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
      { q: 'Is Global Trade Infrastructure live?', a: 'Yes — the public marketing and onboarding surface is live at trade.baalvion.com, alongside the authenticated trade-operations control center for verified buyers, sellers, and institutions.' },
      { q: 'Who is it built for?', a: 'Enterprises, banks, government and customs authorities, and logistics carriers transacting cross-border trade.' },
      { q: 'How does the shipping directory relate to the trade platform?', a: 'World Shipping Directory (ships.baalvion.com) is part of Global Trade Infrastructure, published on its own subdomain as a public reference registry of vessels and the companies that operate them.' },
    ],
    sourceNote: 'Sourced from the Global-Trade-Infrastructure-main repository README and the live public pages at trade.baalvion.com and ships.baalvion.com.',
  },
};

export function getNetworkDetail(slug: string): NetworkDetail | null {
  return NETWORK_DETAILS[slug] ?? null;
}
