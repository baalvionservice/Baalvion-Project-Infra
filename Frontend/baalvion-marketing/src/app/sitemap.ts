import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/site';

// Required by `output: export` so this route is emitted as a static file.
export const dynamic = 'force-static';

const ROUTE_PRIORITY: { path: string; priority: number; changeFrequency: 'monthly' | 'yearly' }[] = [
  { path: '/', priority: 1, changeFrequency: 'monthly' },
  { path: '/platform', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/solutions', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/solutions/buyers', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/solutions/sellers', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/solutions/trade-agents', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/about', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/resources', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/legal/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/legal/terms', priority: 0.3, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTE_PRIORITY.map(({ path, priority, changeFrequency }) => ({
    url: path === '/' ? SITE.url : `${SITE.url}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
