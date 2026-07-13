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
  '/terms/',
  '/topics/',
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
  '/auth/',
  '/maintenance',
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
      { userAgent: '*', allow: ALLOW, disallow: DISALLOW },
      ...AI_USER_AGENTS.map((userAgent) => ({ userAgent, allow: ALLOW, disallow: DISALLOW })),
    ],
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/news-sitemap.xml`],
  };
}
