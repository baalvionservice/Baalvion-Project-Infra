/**
 * Seed editorial content for the IR site — the standalone fallback used by the same-origin
 * CMS BFF routes (/api/cms/pages, /api/cms/navigation) when the central Baalvion CMS
 * (cms-service) is unreachable. This keeps the public site (home page + primary navigation)
 * fully rendered offline. When the CMS is live, its content takes precedence.
 */
import type { NavigationItem, PageDefinition, PageSection } from '@/core/content/schemas';

const section = (
  id: string,
  type: string,
  order: number,
  anchor?: string,
): PageSection => ({
  id,
  type,
  order,
  isActive: true,
  roles: ['public'],
  content: anchor ? { anchor } : {},
});

/** The institutional landing page, assembled from the registered section components. */
export const SEED_HOME_PAGE: PageDefinition = {
  id: 'seed-home',
  slug: '/',
  title: 'Baalvion Industries — Investor Relations',
  description:
    'Investor relations for Baalvion Industries Private Limited — building the integrated infrastructure for global B2B trade across logistics, trade finance and compliance.',
  status: 'Published',
  workflowStatus: 'Published',
  currentVersion: 1,
  versionHistory: [],
  seo: {
    title: 'Baalvion Industries — Investor Relations | Global B2B Trade Infrastructure',
    description:
      'Strategy, governance, financial results and the investment thesis of Baalvion Industries Private Limited — the operating system for global B2B trade. Information for qualified and institutional investors.',
    keywords: ['Baalvion Industries', 'investor relations', 'B2B trade', 'trade finance', 'logistics technology', 'global commerce', 'private placement', 'institutional investors', 'governance'],
  },
  sections: [
    section('sec-hero', 'hero', 0),
    section('sec-who', 'who-we-are', 1, 'who-we-are'),
    section('sec-trust', 'trust-signals', 2, 'trust'),
    section('sec-quarterly', 'quarterly-results', 3, 'results'),
    section('sec-overview', 'overview', 4, 'overview'),
    section('sec-market', 'market-opportunity', 5, 'opportunity'),
    section('sec-thesis', 'thesis', 6, 'thesis'),
    section('sec-platform', 'platform', 7, 'platform'),
    section('sec-model', 'business-model', 8, 'business-model'),
    section('sec-governance', 'governance', 9, 'governance'),
    section('sec-news', 'news', 10, 'news'),
    section('sec-press', 'press-releases', 11, 'press-releases'),
    section('sec-risk', 'risk', 12, 'risk'),
  ],
};

export const SEED_PAGES: PageDefinition[] = [SEED_HOME_PAGE];

const nav = (
  id: string,
  label: string,
  order: number,
  opts: { href?: string; children?: NavigationItem[] } = {},
): NavigationItem => ({
  id,
  label,
  order,
  isActive: true,
  roles: ['public'],
  href: opts.href,
  children: opts.children,
});

/** Primary navigation mirroring the site's real routes. Access is enforced by middleware. */
export const SEED_NAVIGATION: NavigationItem[] = [
  nav('nav-governance', 'Governance', 0, {
    children: [
      nav('nav-gov-overview', 'Overview', 0, { href: '/governance/overview' }),
      nav('nav-gov-board', 'Board of Directors', 1, {
        href: '/governance/board-of-directors',
      }),
      nav('nav-gov-leadership', 'Leadership', 2, { href: '/governance/leadership' }),
      nav('nav-gov-committee', 'Committee Composition', 3, {
        href: '/governance/committee-composition',
      }),
      nav('nav-gov-voting', 'My Voting', 4, { href: '/governance/my-voting' }),
    ],
  }),
  nav('nav-news', 'News & Events', 1, {
    children: [
      nav('nav-news-news', 'News', 0, { href: '/news-and-events/news' }),
      nav('nav-news-press', 'Press Releases', 1, {
        href: '/news-and-events/press-releases',
      }),
      nav('nav-news-events', 'Events', 2, { href: '/news-and-events/events' }),
      nav('nav-news-webcast', 'Webcast', 3, { href: '/news-and-events/webcast' }),
      nav('nav-news-investor-day', 'Investor Day', 4, {
        href: '/news-and-events/investor-day',
      }),
    ],
  }),
  nav('nav-portal', 'Investor Portal', 2, {
    children: [
      nav('nav-portal-dashboard', 'Dashboard', 0, { href: '/dashboard' }),
      nav('nav-portal-capital', 'Capital Operations', 1, { href: '/capital-ops' }),
      nav('nav-portal-operator', 'Strategic Operator', 2, { href: '/strategic-operator' }),
    ],
  }),
  nav('nav-resources', 'Resources', 3, {
    children: [
      nav('nav-res-contact', 'Contact IR', 0, { href: '/resources/contact-ir' }),
      nav('nav-res-alerts', 'Email Alerts', 1, { href: '/resources/email-alerts' }),
    ],
  }),
];
