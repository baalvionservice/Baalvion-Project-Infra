import { MetadataRoute } from 'next';

/**
 * @fileOverview Robots.txt Configuration for GeoTrade Nexus.
 * Manages search engine crawl budget and blocks private environments.
 */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/dashboard/',
          '/api/',
          '/login',
          '/register',
          '/admin-demo-access',
          '/*?*', // Disallow crawling of URLs with query parameters to save crawl budget
        ],
      },
    ],
    // sitemap: `${SITEMAP_BASE_URL}/sitemap.xml`,
  };
}
