import type { MetadataRoute } from 'next';

/**
 * Internal admin & CMS platform — MUST NEVER be indexed by search engines
 * or AI crawlers. The root layout already sets `robots: { index: false }`;
 * this is the defense-in-depth crawl-level block (belt and suspenders).
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
