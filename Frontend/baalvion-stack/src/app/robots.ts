import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    // Everything is public and every page is meant to be indexed — there is nothing here that
    // is not already a published product.
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://baalvionstack.com/sitemap.xml',
    host: 'https://baalvionstack.com',
  };
}
