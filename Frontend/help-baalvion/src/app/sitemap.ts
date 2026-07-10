import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';
import { ALL_ITEMS } from '@/lib/nav';

// Required by `output: export` so this route is emitted as a static file.
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified, changeFrequency: 'weekly', priority: 1 },
  ];

  const docRoutes: MetadataRoute.Sitemap = ALL_ITEMS.map((item) => ({
    url: `${SITE.url}${item.href}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...docRoutes];
}
