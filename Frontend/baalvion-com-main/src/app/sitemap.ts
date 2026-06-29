import type { MetadataRoute } from 'next';
import { ROUTES, SITE } from '@/lib/content';

// Required by `output: export` so this route is emitted as a static file.
export const dynamic = 'force-static';

/**
 * Public, indexable routes only. Authentication surfaces (/signin, /register,
 * /account/recovery) are intentionally excluded — they are noindex.
 */
const ROUTE_PRIORITY: { path: string; priority: number; changeFrequency: 'monthly' | 'yearly' }[] = [
  { path: ROUTES.home, priority: 1, changeFrequency: 'monthly' },
  { path: ROUTES.about, priority: 0.9, changeFrequency: 'monthly' },
  { path: ROUTES.services, priority: 0.9, changeFrequency: 'monthly' },
  { path: ROUTES.email, priority: 0.8, changeFrequency: 'monthly' },
  { path: ROUTES.security, priority: 0.7, changeFrequency: 'monthly' },
  { path: ROUTES.contact, priority: 0.7, changeFrequency: 'monthly' },
  { path: ROUTES.privacy, priority: 0.5, changeFrequency: 'yearly' },
  { path: ROUTES.terms, priority: 0.5, changeFrequency: 'yearly' },
  { path: ROUTES.cookies, priority: 0.4, changeFrequency: 'yearly' },
  { path: ROUTES.acceptableUse, priority: 0.4, changeFrequency: 'yearly' },
  { path: ROUTES.dataProtection, priority: 0.4, changeFrequency: 'yearly' },
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
