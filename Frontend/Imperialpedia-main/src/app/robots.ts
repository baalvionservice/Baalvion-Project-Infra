import { MetadataRoute } from 'next';
import { env } from '@/config/env';

/**
 * robots.txt configuration for search engine crawlers.
 * Engineered to maximize discovery of intelligence nodes while shielding governance clusters.
 */

const ALLOW = [
  '/',
  '/about',
  '/contact',
  '/privacy-policy',
  '/terms-of-service',
  '/disclaimer',
  '/transparency',
  '/budgeting',
  '/financial-intelligence',
  '/financial-intelligence/',
  '/authors',
  '/authors/',
  '/financial-tools/',
];

const DISALLOW = [
  '/admin/',
  '/api/',
  '/private/',
  '/creator/dashboard/',
  '/dashboard/',
  '/editor/',
  '/writer/',
  '/outline',
  '/auth/',
  '/maintenance',
  // Placeholder/skeleton pages with no real content yet — keep out of crawl
  // and index until real pricing tiers / dataset listings ship.
  '/pricing',
  '/datasets',
  // Legacy duplicate of /financial-tools/[slug] (the real, working calculators) --
  // same topics/slugs (compound-interest, loan, investment, ...), backed by mock
  // data, body is a literal "Coming Soon" placeholder. Was live and indexable.
  '/calculators/',
  // Glossary/topic-discovery surface offline pending Google AdSense approval —
  // every route under these prefixes now 404s. Remove once GLOSSARY_LIVE flips
  // back to true in src/config/glossary.ts.
  // "/terms$" (not a bare "/terms" prefix) so this doesn't also swallow the
  // unrelated, still-live "/terms-of-service" page above.
  '/terms$',
  '/terms/',
  '/terms-beginning-with-',
  '/topics',
  '/learning-paths',
];

// AI crawlers explicitly allowed (same allow/disallow scope as regular search
// engines — private routes stay protected from AI bots too). Covers both
// training crawlers (GPTBot, CCBot, Bytespider, Google-Extended, Amazonbot)
// and live citation/search bots (OAI-SearchBot, ChatGPT-User, PerplexityBot,
// ClaudeBot, Applebot-Extended) so content can surface — and be cited — in
// AI answer engines (ChatGPT, Perplexity, Google AI Overviews, Copilot).
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
  const baseUrl = env.siteUrl || 'https://imperialpedia.com';

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
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/news-sitemap.xml`],
  };
}
