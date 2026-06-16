import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/content';

// Required by `output: export` so this route is emitted as a static file.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE.url,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];
}
