import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/content';

// Required by `output: export` so this route is emitted as a static file.
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
