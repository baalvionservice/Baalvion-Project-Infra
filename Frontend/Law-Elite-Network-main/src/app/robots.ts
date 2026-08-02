import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

const ALLOW = ['/', '/news', '/search', '/plans', '/about-us', '/contact-us', '/careers', '/advertise', '/editorial-process', '/privacy-policy', '/terms-of-service', '/editorial-disclosure-policy', '/article/', '/law/'];

const DISALLOW = [
  '/dashboard',
  '/admin/',
  '/profile',
  '/cases/',
  '/chat/',
  '/appointments',
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
  // Lawyer directory is empty until real, verified attorney data is loaded —
  // pulled from nav/sitemap and disallowed here so it isn't crawled or
  // indexed while it's just an empty results page. Re-enable alongside the
  // nav links in PublicNavbar/PublicFooter/homepage once populated.
  '/lawyers',
  '/lawyer/',
  '/api/',
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
      { userAgent: '*', allow: ALLOW, disallow: DISALLOW },
      ...AI_USER_AGENTS.map((userAgent) => ({ userAgent, allow: ALLOW, disallow: DISALLOW })),
    ],
    sitemap: [`${BASE_URL}/sitemap.xml`, `${BASE_URL}/news-sitemap.xml`],
    host: BASE_URL,
  };
}
