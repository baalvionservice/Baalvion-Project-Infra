import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Note: `/candidate/<id>` and `/company/<id>` are PUBLIC, indexable
      // profile pages, so the `/candidate/` and `/company/` prefixes are
      // deliberately NOT disallowed here. The authenticated app surfaces under
      // those prefixes are kept out of the index via per-segment
      // `robots: { index: false, follow: false }` metadata instead.
      disallow: ['/admin/', '/dashboard', '/login', '/signup'],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
