import { MetadataRoute } from 'next';
import { products, suppliers, blogPosts, guides, tradePages, SITEMAP_BASE_URL } from '@/lib/sitemap-data';
import { pseoPages, isValidPseoPage } from '@/lib/pseo-data';

/**
 * @fileOverview Automatic Sitemap Generator for Baalvion Mining Inc.
 * Filters low-quality programmatic pages to optimize crawl budget.
 */

export default function sitemap(): MetadataRoute.Sitemap {
  // Static Routes
  const routes = [
    '',
    '/marketplace',
    '/directory',
    '/solutions',
    '/compliance',
    '/logistics',
    '/partnership-plan',
    '/blog',
    '/guides',
    '/help',
    '/contact',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${SITEMAP_BASE_URL}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  // Dynamic Product Pages
  const productEntries = products.map((p) => ({
    url: `${SITEMAP_BASE_URL}/marketplace/${p.slug}`,
    lastModified: p.lastMod,
    changeFrequency: 'weekly' as const,
    priority: p.priority,
  }));

  // Dynamic Supplier Pages
  const supplierEntries = suppliers.map((s) => ({
    url: `${SITEMAP_BASE_URL}/directory/${s.slug}`,
    lastModified: s.lastMod,
    changeFrequency: 'weekly' as const,
    priority: s.priority,
  }));

  // Dynamic Blog Posts
  const blogEntries = blogPosts.map((b) => ({
    url: `${SITEMAP_BASE_URL}/blog/${b.slug}`,
    lastModified: b.lastMod,
    changeFrequency: 'monthly' as const,
    priority: b.priority,
  }));

  // Dynamic Content Guides
  const guideEntries = guides.map((g) => ({
    url: `${SITEMAP_BASE_URL}/guides/${g.slug}`,
    lastModified: g.lastMod,
    changeFrequency: 'monthly' as const,
    priority: g.priority,
  }));

  // Programmatic SEO Trade Pages (Quality Filtered)
  const tradeEntries = pseoPages
    .filter(isValidPseoPage)
    .map((t) => ({
      url: `${SITEMAP_BASE_URL}/trade/${t.slug}`,
      lastModified: t.lastMod,
      changeFrequency: 'weekly' as const,
      priority: t.priority,
    }));

  return [
    ...routes, 
    ...productEntries, 
    ...supplierEntries, 
    ...blogEntries, 
    ...guideEntries, 
    ...tradeEntries
  ];
}
