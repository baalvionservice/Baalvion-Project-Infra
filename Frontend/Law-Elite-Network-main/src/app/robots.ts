import { MetadataRoute } from 'next';
import { CURRENT_CATEGORY_SLUGS } from '@/lib/category-slugs';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

// Practice-area categories are top-level routes (/{slug} + nested
// /{slug}/{article}) since the URL restructure -- listed explicitly even
// though '/' already covers them, for parity with the other section prefixes
// below. Sourced from CURRENT_CATEGORY_SLUGS (lib/category-slugs.ts) instead
// of a hardcoded duplicate list -- this previously still listed only the
// original 8 categories after 8 more were added there, so newer categories
// (e.g. /boating-accidents, /legal-education-and-history) had no explicit
// Allow entry even though CURRENT_CATEGORY_SLUGS elsewhere in the codebase
// already treats them as real, indexable routes. /law/ stays allowed
// forever: those URLs now permanently (308) redirect to their new home, and
// a redirect source must stay crawlable for Google to keep following and
// crediting it -- disallowing it would strand the old URLs' accumulated
// ranking signal instead of transferring it.
const ALLOW = [
  '/',
  '/news',
  '/search',
  '/plans',
  '/about-us',
  '/contact-us',
  '/careers',
  '/advertise',
  '/editorial-process',
  '/editorial-standards',
  '/corrections',
  '/privacy-policy',
  '/terms-of-service',
  '/editorial-disclosure-policy',
  '/cookie-policy',
  '/ai-usage-policy',
  '/diversity-policy',
  '/accessibility',
  '/conflict-of-interest-policy',
  '/sponsored-content-policy',
  '/comment-policy',
  '/policies',
  '/article/',
  '/law/',
  ...CURRENT_CATEGORY_SLUGS.map((slug) => `/${slug}`),
  '/countries',
  '/authors',
  '/author/',
];

const DISALLOW = [
  '/dashboard',
  '/admin/',
  '/profile',
  '/cases/',
  '/chat/',
  '/vault',
  '/transactions',
  '/billing',
  '/notifications',
  '/my-counsel',
  '/referral',
  '/onboarding',
  '/checkout/',
  '/booking/',
  '/booking-details/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/access-denied',
  // Individual lawyer profile pages remain reachable; the /lawyers directory
  // page itself was removed from the frontend, so it needs no disallow entry.
  '/lawyer/',
  '/api/',
  // Auth-gated, not linked from the sitemap, but not previously disallowed --
  // add explicitly so no crawl path (internal link, external backlink) can
  // reach them and find only an auth wall.
  '/network',
  '/groups',
];

// AI crawlers explicitly allowed (same allow/disallow scope as regular search
// engines — private routes stay protected from AI bots too). Covers both
// training crawlers (GPTBot, CCBot, Bytespider, Google-Extended, Amazonbot)
// and live citation/search bots (OAI-SearchBot, ChatGPT-User, PerplexityBot,
// ClaudeBot, Applebot-Extended) so legal guides can surface — and be cited —
// in AI answer engines (ChatGPT, Perplexity, Google AI Overviews, Copilot).
const AI_USER_AGENTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
  'Bytespider',
  'Amazonbot',
  'Diffbot',
  'meta-externalagent',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Google's AdSense ad-serving crawler needs full access to read page
      // content and choose relevant/safe ads, even on routes hidden from
      // search engines below -- with no dedicated rule it falls back to the
      // '*' group's DISALLOW list, which is Google's documented cause of
      // "couldn't verify your site" / ads not serving.
      { userAgent: 'Mediapartners-Google', allow: '/' },
      { userAgent: '*', allow: ALLOW, disallow: DISALLOW },
      ...AI_USER_AGENTS.map((userAgent) => ({ userAgent, allow: ALLOW, disallow: DISALLOW })),
    ],
    sitemap: [`${BASE_URL}/sitemap.xml`, `${BASE_URL}/news-sitemap.xml`],
    host: BASE_URL,
  };
}
