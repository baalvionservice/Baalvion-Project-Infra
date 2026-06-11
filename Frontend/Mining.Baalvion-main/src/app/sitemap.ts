import { MetadataRoute } from 'next';
import { products, suppliers, blogPosts, guides, tradePages, SITEMAP_BASE_URL } from '@/lib/sitemap-data';
import { pseoPages, isValidPseoPage } from '@/lib/pseo-data';

/**
 * @fileOverview Automatic Sitemap Generator for Baalvion Mining Inc.
 * Filters low-quality programmatic pages to optimize crawl budget.
 */

export default function sitemap(): MetadataRoute.Sitemap {
  // Static Routes — kept in sync with real, existing app routes only.
  const today = new Date().toISOString().split('T')[0];
  const routeDefs: { path: string; priority: number; freq: 'daily' | 'weekly' | 'monthly' }[] = [
    { path: '', priority: 1.0, freq: 'daily' },
    // Trade ecosystem
    { path: '/marketplace', priority: 0.9, freq: 'daily' },
    { path: '/directory', priority: 0.8, freq: 'weekly' },
    { path: '/solutions', priority: 0.8, freq: 'weekly' },
    { path: '/logistics', priority: 0.7, freq: 'weekly' },
    { path: '/tenders', priority: 0.6, freq: 'weekly' },
    { path: '/partnership-plan', priority: 0.6, freq: 'monthly' },
    // Company & corporate
    { path: '/about', priority: 0.8, freq: 'monthly' },
    { path: '/leadership', priority: 0.6, freq: 'monthly' },
    { path: '/certifications', priority: 0.6, freq: 'monthly' },
    { path: '/investors', priority: 0.7, freq: 'monthly' },
    { path: '/careers', priority: 0.6, freq: 'weekly' },
    { path: '/contact', priority: 0.7, freq: 'monthly' },
    // Operations & responsibility
    { path: '/operations', priority: 0.7, freq: 'monthly' },
    { path: '/projects', priority: 0.6, freq: 'monthly' },
    { path: '/hse', priority: 0.6, freq: 'monthly' },
    { path: '/esg', priority: 0.7, freq: 'monthly' },
    { path: '/community', priority: 0.5, freq: 'monthly' },
    { path: '/csr', priority: 0.5, freq: 'monthly' },
    { path: '/gallery', priority: 0.4, freq: 'monthly' },
    // Knowledge
    { path: '/blog', priority: 0.7, freq: 'daily' },
    { path: '/guides', priority: 0.7, freq: 'weekly' },
    { path: '/help', priority: 0.5, freq: 'monthly' },
    // Legal & compliance
    { path: '/privacy', priority: 0.4, freq: 'monthly' },
    { path: '/terms', priority: 0.4, freq: 'monthly' },
    { path: '/cookies', priority: 0.3, freq: 'monthly' },
    { path: '/disclaimer', priority: 0.3, freq: 'monthly' },
    { path: '/aml-kyc', priority: 0.4, freq: 'monthly' },
    { path: '/refund-policy', priority: 0.3, freq: 'monthly' },
    { path: '/responsible-sourcing', priority: 0.4, freq: 'monthly' },
    { path: '/data-processing', priority: 0.3, freq: 'monthly' },
  ];
  const routes = routeDefs.map(({ path, priority, freq }) => ({
    url: `${SITEMAP_BASE_URL}${path}`,
    lastModified: today,
    changeFrequency: freq,
    priority,
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
