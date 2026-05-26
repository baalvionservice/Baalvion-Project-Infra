import { MetadataRoute } from 'next';
import { env } from '@/config/env';

const BASE = env.siteUrl || 'https://imperialpedia.com';
const API = env.apiBaseUrl;

async function safeFetch<T>(url: string): Promise<T[]> {
  if (!API) return [];
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : (json.data ?? json.items ?? json.results ?? []);
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/articles`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/news`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/market`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE}/explore`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/topics`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/financial-tools`, lastModified: now, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/financial-tools/compound-interest`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/financial-tools/inflation`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/financial-tools/investment`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/financial-tools/loan`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/financial-tools/portfolio`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/financial-tools/retirement`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/ai-analyst`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/ai-analyst/daily-briefing`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/ai-analyst/macro-summary`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/ai-analyst/earnings-summary`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/ai-analyst/sector-overview`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/ai-analyst/risk-detection`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/stocks`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/bonds`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/etfs`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/crypto`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE}/commodities`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/options`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/market-news`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE}/live-market-news`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE}/earnings`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/calendar`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/indicators`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/economy`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE}/inflation`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/interest-rates`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/fed`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/gdp`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/fiscal-policy`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/monetary-policy`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/unemployment`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/global`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/world`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/countries`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/companies`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/industries`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/technologies`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/investing`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/personal-finance`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/banking`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/budgeting`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/savings`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/credit`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/credit-cards`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/mortgages`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/loans`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/insurance`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/retirement`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/taxes`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/debt`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/income`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/emergency-fund`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/estate-planning`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/planning`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/real-estate`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/brokers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/robo-advisors`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/reviews`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/community`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE}/community/discussions`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE}/community/debates`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE}/creators`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE}/learning-paths`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/pricing`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/transparency`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/privacy-policy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE}/terms-of-service`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const [articles, categories, tags, glossaryTerms, companies, countries, industries] =
    await Promise.all([
      safeFetch<{ slug: string; updatedAt?: string }>(`${API}/articles?fields=slug,updatedAt&limit=5000&status=published`),
      safeFetch<{ slug: string; updatedAt?: string }>(`${API}/categories?fields=slug,updatedAt&limit=1000`),
      safeFetch<{ slug: string; updatedAt?: string }>(`${API}/tags?fields=slug,updatedAt&limit=2000`),
      safeFetch<{ letter: string; slug: string; updatedAt?: string }>(`${API}/glossary/terms?fields=letter,slug,updatedAt&limit=10000`),
      safeFetch<{ slug: string; updatedAt?: string }>(`${API}/companies?fields=slug,updatedAt&limit=5000&status=active`),
      safeFetch<{ slug: string; updatedAt?: string }>(`${API}/countries?fields=slug,updatedAt&limit=300`),
      safeFetch<{ slug: string; updatedAt?: string }>(`${API}/industries?fields=slug,updatedAt&limit=500`),
    ]);

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${BASE}/articles/${a.slug}`,
    lastModified: a.updatedAt ? new Date(a.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE}/categories/${c.slug}`,
    lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const tagRoutes: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${BASE}/tags/${t.slug}`,
    lastModified: t.updatedAt ? new Date(t.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  const glossaryRoutes: MetadataRoute.Sitemap = glossaryTerms.map((t) => ({
    url: `${BASE}/terms/${t.letter}/${t.slug}`,
    lastModified: t.updatedAt ? new Date(t.updatedAt) : now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const companyRoutes: MetadataRoute.Sitemap = companies.map((c) => ({
    url: `${BASE}/companies/${c.slug}`,
    lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const countryRoutes: MetadataRoute.Sitemap = countries.map((c) => ({
    url: `${BASE}/countries/${c.slug}`,
    lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const industryRoutes: MetadataRoute.Sitemap = industries.map((i) => ({
    url: `${BASE}/industries/${i.slug}`,
    lastModified: i.updatedAt ? new Date(i.updatedAt) : now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [
    ...staticRoutes,
    ...articleRoutes,
    ...categoryRoutes,
    ...tagRoutes,
    ...glossaryRoutes,
    ...companyRoutes,
    ...countryRoutes,
    ...industryRoutes,
  ];
}
