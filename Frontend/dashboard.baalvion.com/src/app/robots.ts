import type { MetadataRoute } from 'next';

/**
 * Company unified dashboard — an authenticated, internal application surface.
 * It must never appear in search engines or AI crawler indexes. The root
 * layout already sets `robots: { index: false }`; this adds the crawl-level
 * disallow as defense in depth.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',
      },
    ],
  };
}
