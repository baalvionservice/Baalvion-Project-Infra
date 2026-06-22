import type { PopulatedPage } from '@/lib/cms';

/**
 * Static fallback for the home page.
 *
 * The home page renders from live CMS content (cms-service). When the CMS is
 * unreachable — local dev with backends down, a deploy before the CMS is up, or
 * a transient outage — `getHomePageData()` returns null. Rather than throw and
 * surface a 500, the page renders this brand-consistent fallback so the site is
 * always available (HTTP 200). The moment the CMS comes back, live content is
 * served again automatically (the page is `force-dynamic` and never caches this).
 *
 * Keep the section shapes in sync with `HomePageServer`, which reads the
 * `hero`, `problem`, `solution`, and `cta-final` section types.
 */
export const HOMEPAGE_FALLBACK: PopulatedPage = {
  id: 'home-fallback',
  slug: 'home',
  title: 'Baalvion — Global Trade Infrastructure Platform',
  sections: ['hero', 'problem', 'solution', 'cta-final'],
  sectionData: [
    {
      id: 'hero',
      type: 'hero',
      title: 'The Operating System for Global Trade',
      description:
        'Baalvion unifies businesses, finance, compliance, and intelligence into one infrastructure layer — so global commerce runs as a single, coordinated system.',
      data: {
        label: 'Baalvion Operating System (BOS)',
        ctaPrimary: 'Explore the Platform',
        ctaSecondary: 'Partner With Us',
        stats: [
          { value: '198', label: 'Markets Connected' },
          { value: '$8.4B', label: 'Annual Clearing' },
          { value: '180+', label: 'Jurisdictions Mapped' },
          { value: 'T-0', label: 'Settlement Latency' },
        ],
      },
    },
    {
      id: 'problem',
      type: 'problem',
      title: 'Global trade still runs on fragmented, disconnected systems',
      description:
        'Every cross-border transaction passes through a patchwork of intermediaries, compliance silos, and incompatible platforms — adding cost, delay, and risk at every step.',
      data: {
        points: [
          {
            title: 'Fragmented Workflows',
            desc: 'Disconnected tools force manual reconciliation across finance, logistics, and compliance.',
          },
          {
            title: 'Opaque Compliance',
            desc: 'Jurisdiction rules shift constantly, leaving teams exposed to regulatory risk.',
          },
          {
            title: 'Settlement Friction',
            desc: 'Multi-day clearing and currency conversion lock up capital and slow growth.',
          },
        ],
      },
    },
    {
      id: 'solution',
      type: 'solution',
      title: 'One unified execution layer for global commerce',
      description:
        'The Baalvion Operating System connects every node of the trade network — from onboarding to settlement — into a single, programmable protocol.',
      data: {
        features: [
          {
            title: 'Unified Data Core',
            desc: 'A single source of truth across every business, partner, and transaction.',
          },
          {
            title: 'Built-in Compliance',
            desc: 'Real-time legal and KYC/AML mapping across 180+ jurisdictions.',
          },
          {
            title: 'Instant Clearing',
            desc: 'T-0 settlement with a dynamic multi-currency clearing engine.',
          },
        ],
      },
    },
    {
      id: 'cta-final',
      type: 'cta-final',
      title: 'Build on the infrastructure of global trade',
      description:
        'Partner with Baalvion to connect your operations to a unified, intelligent commerce network.',
      data: {
        ctaPrimary: 'Get Started',
        ctaSecondary: 'Contact Strategy Team',
      },
    },
  ],
  seo: {
    title: 'Baalvion — Global Trade Infrastructure Platform',
    description:
      'Baalvion builds global trade infrastructure connecting businesses, finance, compliance, and intelligence into one unified platform.',
  },
};
