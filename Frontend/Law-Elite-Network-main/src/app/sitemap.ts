import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

interface LawyerEntry { id: string; updated_at?: string; updatedAt?: string }
interface ArticleEntry { slug: string; updated_at?: string; updatedAt?: string }
interface CategoryEntry { slug: string; updated_at?: string; updatedAt?: string }

// law-service wraps lists as { data: { items: [...] } } and singles as { data: [...] }.
async function safeFetch<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const d = json?.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.items)) return d.items;
    return [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // No localhost fallback in production: an unset build arg yields '' so safeFetch
  // fails closed (sitemap degrades to static routes) instead of probing localhost.
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3015/v1');

  const [lawyers, articles, categories] = await Promise.all([
    safeFetch<LawyerEntry>(`${apiBase}/lawyers?limit=1000`),
    safeFetch<ArticleEntry>(`${apiBase}/articles?limit=1000`),
    safeFetch<CategoryEntry>(`${apiBase}/categories`),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/plans`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/about-us`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/contact-us`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/careers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE_URL}/advertise`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/editorial-process`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/terms-of-service`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ];

  const lawyerRoutes: MetadataRoute.Sitemap = lawyers.map((l) => ({
    url: `${BASE_URL}/lawyer/${l.id}`,
    lastModified: new Date(l.updated_at || l.updatedAt || Date.now()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/article/${a.slug}`,
    lastModified: new Date(a.updated_at || a.updatedAt || Date.now()),
    changeFrequency: 'weekly',
    priority: 0.65,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/law/${c.slug}`,
    lastModified: new Date(c.updated_at || c.updatedAt || Date.now()),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...lawyerRoutes, ...articleRoutes, ...categoryRoutes];
}
