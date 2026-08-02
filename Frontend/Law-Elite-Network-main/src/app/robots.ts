import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

// The 8 practice-area categories are top-level routes (/{slug} + nested
// /{slug}/{article}) since the URL restructure -- listed explicitly even
// though '/' already covers them, for parity with the other section prefixes
// below. /law/ stays allowed forever: those URLs now permanently (308)
// redirect to their new home, and a redirect source must stay crawlable for
// Google to keep following and crediting it -- disallowing it would strand
// the old URLs' accumulated ranking signal instead of transferring it.
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
  '/privacy-policy',
  '/terms-of-service',
  '/editorial-disclosure-policy',
  '/lawyers/',
  '/article/',
  '/law/',
  '/legal/',
  '/business',
  '/criminal-law',
  '/family-law',
  '/real-estate-law',
  '/tax-finance',
  '/employment-law',
  '/tech-ip',
  '/disputes',
  '/countries',
];

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
  '/lawyer/dashboard',
  '/lawyer/earnings',
  '/lawyer/requests',
  '/lawyer/availability',
  '/lawyer/profile',
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
