import { MetadataRoute } from 'next';
import { env } from '@/config/env';

/**
 * robots.txt configuration for search engine crawlers.
 * Engineered to maximize discovery of intelligence nodes while shielding governance clusters.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = env.siteUrl || 'https://imperialpedia.com';

  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/about',
        '/contact',
        '/budgeting',
        '/articles/',
        '/glossary/',
        '/topics/',
        '/categories/',
        '/tags/',
        '/financial-tools/',
        '/ai-analyst/',
      ],
      disallow: [
        '/admin/',
        '/api/',
        '/private/',
        '/creator/dashboard/',
        '/dashboard/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
