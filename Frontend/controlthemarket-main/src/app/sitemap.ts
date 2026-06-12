import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site-url';
import { getFullArticleSlugs } from '@/components/blog/data';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  // Static, publicly indexable routes. Dynamic detail routes
  // (candidate/[id], company/[id]) are intentionally omitted here because the
  // data source is the authenticated CTM API (no public, crawl-safe listing
  // endpoint is wired). They are still independently indexable via the
  // canonical + OpenGraph metadata emitted by their generateMetadata exports.
  const routes: Array<{
    path: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }> = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/companies', changeFrequency: 'daily', priority: 0.9 },
    { path: '/leaderboard', changeFrequency: 'daily', priority: 0.9 },
    { path: '/pricing', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/badges', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/contact', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  ];

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // Individual blog articles that have full, crawlable content. Slugs come from
  // the shared blog data module so this list never drifts from the route.
  const blogEntries: MetadataRoute.Sitemap = getFullArticleSlugs().map((slug) => ({
    url: `${base}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...blogEntries];
}
