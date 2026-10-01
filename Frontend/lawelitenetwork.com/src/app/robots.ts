import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

// Crawling is allowed by default, so no per-page Allow list is needed. The old
// file repeated ~60 Allow lines for every one of 14 crawler groups (950 lines),
// which Search Console flagged ("Rule ignored by Googlebot"). One shared group
// keeps it short.
//
// Retired sections (see src/lib/retired-routes.ts) must NOT be disallowed here:
// Googlebot has to fetch them to see the 410 and drop them from the index.
// Same for /law/, whose legacy URLs redirect.

// Every image is served through this resize proxy (src/app/api/image/route.ts),
// so it carves out of the '/api/' disallow below. The more specific Allow wins.
const ALLOW = ['/api/image'];

const DISALLOW = [
  '/dashboard',
  '/admin/',
  '/profile',
  '/chat/',
  '/vault',
  '/transactions',
  '/billing',
  '/notifications',
  '/following',
  '/saved',
  '/studio',
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
  '/lawyer/',
  '/api/',
  '/network',
  '/groups',
];

// AI crawlers get the same scope as regular search engines, so legal guides can
// still be cited in answer engines while private routes stay protected.
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
      // AdSense's crawler needs full access; without its own group it would fall
      // back to the '*' disallow list and fail to verify the site.
      { userAgent: 'Mediapartners-Google', allow: '/' },
      { userAgent: ['*', ...AI_USER_AGENTS], allow: ALLOW, disallow: DISALLOW },
    ],
    sitemap: [`${BASE_URL}/sitemap.xml`, `${BASE_URL}/news-sitemap.xml`],
  };
}
