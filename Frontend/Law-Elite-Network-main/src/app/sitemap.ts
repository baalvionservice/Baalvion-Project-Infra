import { MetadataRoute } from 'next';
import { getAllArticles } from '@/data/law-content';
import { getAllAuthors } from '@/data/authors';
import { articleUrl } from '@/lib/article-url';
import { toNewCategorySlug } from '@/lib/category-slugs';

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
    { url: `${BASE_URL}/news`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.85 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/plans`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/lawyers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/about-us`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/authors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/legal`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.55 },
    { url: `${BASE_URL}/editorial-standards`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/corrections`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/contact-us`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/careers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE_URL}/advertise`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/editorial-process`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/terms-of-service`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/editorial-disclosure-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/cookie-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/ai-usage-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/diversity-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.15 },
    { url: `${BASE_URL}/accessibility`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.15 },
    { url: `${BASE_URL}/conflict-of-interest-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.15 },
    { url: `${BASE_URL}/sponsored-content-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.15 },
    { url: `${BASE_URL}/comment-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.15 },
  ];

  // A–Z legal glossary letter pages — each now has its own distinct
  // title/description/canonical (see src/app/legal/[letter]/layout.tsx), so
  // they belong in the sitemap as real indexable pages, not just linked from /legal.
  // Letters with zero bundled articles get `noindex` there (same `bundledCount`
  // check) — a sitemap should only ever list indexable URLs, so those letters
  // are excluded here rather than submitting noindex'd, empty pages to Google.
  const allArticles = getAllArticles();
  const legalLetterRoutes: MetadataRoute.Sitemap = 'abcdefghijklmnopqrstuvwxyz'
    .split('')
    .filter((letter) => allArticles.some((a) => a.alphabet === letter.toUpperCase()))
    .map((letter) => ({
      url: `${BASE_URL}/legal/${letter}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.4,
    }));

  const lawyerRoutes: MetadataRoute.Sitemap = lawyers.map((l) => ({
    url: `${BASE_URL}/lawyer/${l.id}`,
    lastModified: new Date(l.updated_at || l.updatedAt || Date.now()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Bundled articles (always present) unioned with live-API results, deduped by
  // slug -- API wins on lastModified when both exist. Previously this only mapped
  // `articles` (API-sourced), so whenever the live API was unreachable the 45
  // bundled guides had zero <url> entries in the sitemap at all, despite being
  // fully real, indexable content reachable via internal links.
  const articleEntries = new Map<string, { url: string; lastModified: Date }>();
  getAllArticles().forEach((a) => {
    articleEntries.set(a.slug, {
      url: `${BASE_URL}${articleUrl(a)}`,
      lastModified: new Date(a.updatedAt || Date.now()),
    });
  });
  articles.forEach((a) => {
    articleEntries.set(a.slug, {
      url: `${BASE_URL}${articleUrl(a)}`,
      lastModified: new Date(a.updated_at || a.updatedAt || Date.now()),
    });
  });

  const articleRoutes: MetadataRoute.Sitemap = Array.from(articleEntries.values()).map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified,
    changeFrequency: 'weekly',
    priority: 0.65,
  }));

  // Subcategories no longer have a dedicated URL -- they're a filter chip on
  // the category page (?sub=), not a separate indexable page -- so there's no
  // subcategory-routes block here anymore.
  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${BASE_URL}/${toNewCategorySlug(c.slug)}`,
    lastModified: new Date(c.updated_at || c.updatedAt || Date.now()),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  // Author profile pages — one per contributor for E-E-A-T discoverability.
  // lastModified tracks the author's most recently updated bundled article (authors
  // have no timestamp of their own) rather than the request time.
  const latestByAuthor = new Map<string, Date>();
  getAllArticles().forEach((a) => {
    const parsed = new Date(a.updatedAt);
    if (Number.isNaN(parsed.getTime())) return;
    const existing = latestByAuthor.get(a.author);
    if (!existing || parsed > existing) latestByAuthor.set(a.author, parsed);
  });

  const authorRoutes: MetadataRoute.Sitemap = getAllAuthors().map((a) => ({
    url: `${BASE_URL}/author/${a.slug}`,
    lastModified: latestByAuthor.get(a.name) || new Date(),
    changeFrequency: 'monthly',
    priority: 0.45,
  }));

  return [
    ...staticRoutes,
    ...legalLetterRoutes,
    ...lawyerRoutes,
    ...articleRoutes,
    ...categoryRoutes,
    ...authorRoutes,
  ];
}
