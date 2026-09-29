/**
 * Canonical page-builder definitions for the institutional IR pages.
 *
 * Each page is an ordered list of registered section components (see
 * ComponentRegistry). These definitions are the single source of truth that is:
 *   1. rendered server-side by the dedicated route segments (for SSR + per-page SEO),
 *   2. exposed through the same-origin CMS BFF as seed fallback (see cms-seed.ts), and
 *   3. pushed into the central CMS by scripts/seedIrInvestorRelations.cjs so the
 *      composition + SEO of every page stays editable in the admin console.
 *
 * The prose for each section lives inside its component; these records control
 * which sections appear, their order, and the page-level SEO envelope.
 */
import type { PageDefinition, PageSection } from '@/core/content/schemas';

const sec = (type: string, order: number, anchor?: string): PageSection => ({
  id: `sec-${type}`,
  type,
  order,
  isActive: true,
  roles: ['public'],
  content: anchor ? { anchor } : {},
});

const page = (
  slug: string,
  title: string,
  description: string,
  seo: { title: string; description: string; keywords: string[] },
  sectionTypes: string[],
): PageDefinition => ({
  id: `ir-page${slug.replace(/\//g, '-')}`,
  slug,
  title,
  description,
  status: 'Published',
  workflowStatus: 'Published',
  currentVersion: 1,
  versionHistory: [],
  seo,
  sections: sectionTypes.map((t, i) => sec(t, i, t)),
});

/** The institutional IR pages, keyed for both route rendering and CMS seeding. */
export const IR_PAGES: PageDefinition[] = [
  page(
    '/why-invest',
    'Why Invest in Baalvion',
    'Thirteen reasons to invest in Baalvion — an AI-native operating system for global B2B trade, addressing a $13 trillion market across logistics, trade finance and compliance.',
    {
      title: 'Why Invest in Baalvion | AI-Native Global Trade Infrastructure',
      description:
        'Discover why Baalvion is a category-defining investment: a $13T market, a proprietary AI technology moat, integrated platform economics, network effects and multiple revenue streams. Information for qualified and institutional investors.',
      keywords: [
        'why invest in Baalvion', 'AI startup investment', 'trade infrastructure investment',
        'B2B fintech investment', 'AI technology company', 'venture capital opportunity',
        'institutional investment', 'logistics technology', 'trade finance', 'high-growth technology startup',
      ],
    },
    ['why-invest-hero', 'investment-highlights', 'key-metrics', 'growth-strategy', 'investor-cta'],
  ),
  page(
    '/investment-thesis',
    'Investment Thesis',
    'The complete Baalvion investment thesis — problem, solution, market, timing, team, technology, scalability, exit potential and future opportunities.',
    {
      title: 'Investment Thesis | Baalvion AI Trade Infrastructure',
      description:
        'The complete investment thesis for Baalvion: the structural problem in global trade, our AI-native solution, the $13T market, why now is the inflection point, and the path to durable, compounding value.',
      keywords: [
        'Baalvion investment thesis', 'AI investment thesis', 'trade finance startup', 'B2B platform thesis',
        'technology moat', 'network effects', 'scalable SaaS', 'venture thesis', 'fintech infrastructure',
      ],
    },
    ['thesis-detail', 'investor-cta'],
  ),
  page(
    '/market-opportunity',
    'Market Opportunity',
    'Baalvion market opportunity — TAM, SAM and SOM across the $13 trillion global B2B trade market, with industry trends, the AI opportunity and technology-adoption forecasts.',
    {
      title: 'Market Opportunity (TAM, SAM, SOM) | Baalvion',
      description:
        'A generational, AI-addressable market: $13T+ in annual B2B trade flows, a $2.5T trade-finance gap and ~80% still un-digitised. Explore Baalvion’s TAM, SAM, SOM, industry trends and AI market opportunity.',
      keywords: [
        'global trade market size', 'TAM SAM SOM', 'B2B trade market opportunity', 'AI market opportunity',
        'trade finance gap', 'digital trade adoption', 'fintech market size', 'logistics market', 'addressable market',
      ],
    },
    ['market-opportunity-deep', 'growth-strategy', 'investor-cta'],
  ),
  page(
    '/use-of-proceeds',
    'Use of Proceeds',
    'Baalvion’s growth-acceleration plan — a disciplined, milestone-gated allocation of capital across product, AI infrastructure, engineering, R&D, go-to-market, expansion and partnerships.',
    {
      title: 'Use of Proceeds | Baalvion Growth Acceleration Plan',
      description:
        'How Baalvion deploys investment capital: a disciplined, returns-driven plan across product development, AI infrastructure, engineering, R&D, sales & marketing, global expansion, operations and strategic partnerships.',
      keywords: [
        'use of proceeds', 'capital allocation', 'growth acceleration', 'AI infrastructure investment',
        'startup funding allocation', 'R&D investment', 'go-to-market', 'global expansion capital',
      ],
    },
    ['use-of-proceeds', 'investor-cta'],
  ),
  page(
    '/company/story',
    'Our Story',
    'The Baalvion company story — built by operators who lived the problem, on a mission to become the AI-native operating system beneath global B2B commerce.',
    {
      title: 'Our Story | Baalvion Company & Founder Story',
      description:
        'The Baalvion story: why we are building one AI-native platform — not another point tool — to unify logistics, trade finance and compliance, and become the default operating system for global trade.',
      keywords: [
        'Baalvion story', 'company story', 'founder story', 'startup vision', 'AI company mission',
        'trade technology company', 'about Baalvion', 'company history', 'technology startup',
      ],
    },
    ['company-story', 'investor-cta'],
  ),
  page(
    '/financials',
    'Financial Framework',
    'Baalvion’s financial framework — illustrative models for revenue growth, ARR, the path to profitability, gross margins, unit economics, customer growth and an investor returns framework.',
    {
      title: 'Financial Framework | Baalvion Investor Relations',
      description:
        'Baalvion’s illustrative financial framework: revenue growth, ARR trajectory, path to profitability, software-like gross margins, unit economics and an investor returns framework. Forward-looking; not a guarantee of results.',
      keywords: [
        'startup financials', 'ARR', 'unit economics', 'LTV CAC', 'gross margin', 'path to profitability',
        'SaaS metrics', 'investor returns', 'revenue growth', 'financial model',
      ],
    },
    ['financials', 'key-metrics', 'investor-cta'],
  ),
  page(
    '/governance/framework',
    'Corporate Governance',
    'Baalvion’s corporate governance framework — leadership structure, board composition, disclosure, compliance, ethics and an enterprise risk-management framework.',
    {
      title: 'Corporate Governance Framework | Baalvion',
      description:
        'Governance built for institutional trust: Baalvion’s leadership structure, board of directors, governance framework, compliance and ethics statements, and enterprise risk-management framework.',
      keywords: [
        'corporate governance', 'board of directors', 'governance framework', 'compliance', 'ethics',
        'risk management', 'investor governance', 'AML KYC', 'enterprise risk',
      ],
    },
    ['governance-framework', 'investor-cta'],
  ),
  page(
    '/faq',
    'Investor FAQ',
    'Forty answers for serious investors — Baalvion’s business model, revenue, competition, market, technology, expansion, funding, risk factors, vision and exit opportunities.',
    {
      title: 'Investor FAQ | Baalvion — 40 Answers for Investors',
      description:
        'Forty detailed answers for investors evaluating Baalvion: business model, revenue, competition, market, technology, expansion, funding, risk factors, vision and exit opportunities.',
      keywords: [
        'investor FAQ', 'investor questions', 'Baalvion FAQ', 'business model', 'revenue model',
        'risk factors', 'exit opportunities', 'startup due diligence', 'AI company FAQ',
      ],
    },
    ['investor-faq', 'investor-cta'],
  ),
  page(
    '/resources',
    'Investor Resources',
    'The Baalvion investor download center — investor presentations, annual reports, financial statements, news releases, press coverage and media kit.',
    {
      title: 'Investor Resources & Download Center | Baalvion',
      description:
        'Access Baalvion investor resources: investor presentations, annual reports, financial statements, news releases, press coverage and the media kit. For qualified and institutional investors.',
      keywords: [
        'investor resources', 'investor presentation', 'annual report', 'financial statements',
        'press releases', 'media kit', 'download center', 'investor relations materials',
      ],
    },
    ['investor-resources', 'investor-cta'],
  ),
];

export const IR_PAGE_MAP: Record<string, PageDefinition> = Object.fromEntries(
  IR_PAGES.map((p) => [p.slug, p]),
);

/** Public-only view of a page (every IR marketing section is public). */
export function getIrPage(slug: string): PageDefinition | undefined {
  return IR_PAGE_MAP[slug];
}
