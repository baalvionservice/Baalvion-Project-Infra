import { MetadataRoute } from 'next';
import { getAllArticles } from '@/data/law-content';
import { getAllAuthors } from '@/data/authors';

// Render at request time, never at build time. This route fetches from law-service,
// and a build-time fetch against an unreachable API blocks `next build` (CI timeout).
// force-dynamic guarantees the production build never depends on an external service.
export const dynamic = 'force-dynamic';

// Hard cap on any sitemap fetch so a slow/hung upstream degrades to the static
// routes instead of hanging the request.
const FETCH_TIMEOUT_MS = 4000;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

interface LawyerEntry { id: string; updated_at?: string; updatedAt?: string }
interface TaxonomyRef { slug?: string }
interface ArticleEntry {
  slug: string;
  updated_at?: string;
  updatedAt?: string;
  category?: TaxonomyRef;
  subcategory?: TaxonomyRef;
}
interface CategoryEntry { slug: string; updated_at?: string; updatedAt?: string }

// law-service wraps lists as { data: { items: [...] } } and singles as { data: [...] }.
async function safeFetch<T>(url: string): Promise<T[]> {
  // No absolute base URL configured (production with an unset API env) → fail closed
  // to static routes without attempting a relative fetch (which throws under Node).
  if (!/^https?:\/\//i.test(url)) return [];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!res.ok) return [];
    const json = await res.json();
    const d = json?.data;
    if (Array.isArray(d)) return d;
    if (Array.isArray(d?.items)) return d.items;
    return [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
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
    { url: `${BASE_URL}/authors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/editorial-standards`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/corrections`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/contact-us`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/careers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE_URL}/advertise`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/editorial-process`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/terms-of-service`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/disclaimer`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
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

  // Subcategory routes: emit `/law/{categorySlug}/{subSlug}` for every category+subcategory
  // pair that has at least one article. Derived from the bundled baseline (always present)
  // unioned with any taxonomy slugs the live API returns — deduped by the composite path.
  const taxonomyPairs = new Map<string, string>(); // `${cat}/${sub}` -> route URL
  const addPair = (catSlug?: string, subSlug?: string) => {
    if (!catSlug || !subSlug) return;
    taxonomyPairs.set(`${catSlug}/${subSlug}`, `${BASE_URL}/law/${catSlug}/${subSlug}`);
  };
  getAllArticles().forEach((a) => addPair(a.category?.slug, a.subcategory?.slug));
  articles.forEach((a) => addPair(a.category?.slug, a.subcategory?.slug));

  const subcategoryRoutes: MetadataRoute.Sitemap = Array.from(taxonomyPairs.values()).map((url) => ({
    url,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.55,
  }));

  // Author profile pages — one per contributor for E-E-A-T discoverability.
  const authorRoutes: MetadataRoute.Sitemap = getAllAuthors().map((a) => ({
    url: `${BASE_URL}/author/${a.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 0.45,
  }));

  return [
    ...staticRoutes,
    ...lawyerRoutes,
    ...articleRoutes,
    ...categoryRoutes,
    ...subcategoryRoutes,
    ...authorRoutes,
  ];
}
