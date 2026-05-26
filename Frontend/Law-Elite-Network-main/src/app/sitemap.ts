import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

interface LawyerEntry { id: string; updatedAt?: string }
interface ArticleEntry { slug: string; updatedAt?: string }

async function safeFetch<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json?.data) ? json.data : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3015/v1';

  const [lawyers, articles] = await Promise.all([
    safeFetch<LawyerEntry>(`${apiBase}/lawyers?limit=500`),
    safeFetch<ArticleEntry>(`${apiBase}/articles?limit=500`),
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
    url: `${BASE_URL}/lawyers/${l.id}`,
    lastModified: l.updatedAt ? new Date(l.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE_URL}/article/${a.slug}`,
    lastModified: a.updatedAt ? new Date(a.updatedAt) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.65,
  }));

  return [...staticRoutes, ...lawyerRoutes, ...articleRoutes];
}
