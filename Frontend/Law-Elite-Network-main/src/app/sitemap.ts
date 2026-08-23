import { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import { getAllArticles } from '@/data/law-content';
import { getMergedAuthors } from '@/lib/authors-server';
import { articleUrl } from '@/lib/article-url';
import { CURRENT_CATEGORY_SLUGS, toNewCategorySlug } from '@/lib/category-slugs';
import { cmsGetArticles } from '@/lib/cms';
import { COUNTRIES, getCountryArticleCounts } from '@/data/countries';

// Render at request time, never at build time. This route fetches from law-service,
// and a build-time fetch against an unreachable API blocks `next build` (CI timeout).
// force-dynamic guarantees the production build never depends on an external service.
// Caching still happens -- see getCachedSitemapEntries() below -- via
// unstable_cache, which caches data independently of how the route itself
// renders, so Googlebot/browser hits within the cache window get the cached
// result instead of triggering a fresh CMS/law-service round-trip.
export const dynamic = 'force-dynamic';

// Hard cap on any sitemap fetch so a slow/hung upstream degrades to the static
// routes instead of hanging the request.
const FETCH_TIMEOUT_MS = 4000;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';

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
    const res = await fetch(url, { next: { revalidate: 1800 }, signal: controller.signal });
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

/**
 * Actual sitemap assembly, wrapped below in unstable_cache() so it only runs
 * live (hitting law-service + the CMS) once per revalidate window instead of
 * on every request -- the route itself stays force-dynamic (see the comment
 * above), but the expensive part is still cached. If a request lands mid-
 * window, unstable_cache serves the last successfully cached result instead
 * of re-running this, so a transient upstream outage can't intermittently
 * drop CMS/live-API routes from what Googlebot sees.
 */
async function buildSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  // No localhost fallback in production: an unset build arg yields '' so safeFetch
  // fails closed (sitemap degrades to static routes) instead of probing localhost.
  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3015/v1');

  const [articles, categories, cmsArticles] = await Promise.all([
    safeFetch<ArticleEntry>(`${apiBase}/articles?limit=1000`),
    safeFetch<CategoryEntry>(`${apiBase}/categories`),
    cmsGetArticles().catch(() => []),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/news`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.85 },
    { url: `${BASE_URL}/search`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/plans`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE_URL}/case-law`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/legislation`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/law-changes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/about-us`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/authors`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/editorial-standards`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/corrections`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${BASE_URL}/contact-us`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/careers`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE_URL}/advertise`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE_URL}/editorial-process`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/policies`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/privacy-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/terms-of-service`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/editorial-disclosure-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/cookie-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${BASE_URL}/diversity-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.15 },
    { url: `${BASE_URL}/accessibility`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.15 },
    { url: `${BASE_URL}/conflict-of-interest-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.15 },
    { url: `${BASE_URL}/sponsored-content-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.15 },
    { url: `${BASE_URL}/comment-policy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.15 },
  ];

  // Bundled articles (always present) unioned with live-API results and CMS
  // (admin-authored) articles, deduped by slug -- later entries win on a
  // collision. CMS wins last: it's the admin-authored, real-photo content and
  // the source of truth when a slug exists in more than one place (same
  // precedence CategoryContent.tsx uses for the on-page article list).
  // Previously this only mapped `articles` (law-service), so whenever that API
  // was unreachable (empty in production) the 45 bundled guides had zero <url>
  // entries, AND the ~74 real CMS-authored articles were never included at
  // all -- most of the site's actual content had no sitemap entry.
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
  cmsArticles.forEach((a) => {
    articleEntries.set(a.slug, {
      url: `${BASE_URL}${articleUrl(a)}`,
      lastModified: new Date(a.updatedAt || Date.now()),
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
  //
  // Category hubs prefer live API data (real lastModified) but fall back to
  // the static CURRENT_CATEGORY_SLUGS list per-slug -- in production the
  // /categories API has been observed to return empty, which previously
  // dropped all 8 category hub URLs (e.g. /disputes) from the sitemap
  // entirely. Filtering the fallback to slugs the API didn't already cover
  // means a partial API response still gets topped up rather than
  // duplicated.
  const apiCategorySlugs = new Set(categories.map((c) => toNewCategorySlug(c.slug)));
  // law-service's /categories list can include stray/legacy rows that were
  // never meant to be indexable pages (they 404 -- see [categorySlug]/page.tsx's
  // fetchCategory) -- filtering to the curated list here stops those dead URLs
  // from ever being submitted to Google in the first place.
  const currentSlugSet = new Set<string>(CURRENT_CATEGORY_SLUGS);
  const categoryRoutes: MetadataRoute.Sitemap = [
    ...categories
      .filter((c) => currentSlugSet.has(toNewCategorySlug(c.slug)))
      .map((c) => ({
        url: `${BASE_URL}/${toNewCategorySlug(c.slug)}`,
        lastModified: new Date(c.updated_at || c.updatedAt || Date.now()),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
    ...CURRENT_CATEGORY_SLUGS.filter((slug) => !apiCategorySlugs.has(slug)).map((slug) => ({
      url: `${BASE_URL}/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];

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

  // Merged (bundled + CMS-added) authors -- CMS-only authors were previously
  // dropped from the sitemap because this used the bundled-only getAllAuthors(),
  // even though their /author/[slug] pages render fine and are linked from /authors.
  const mergedAuthors = await getMergedAuthors();
  const authorRoutes: MetadataRoute.Sitemap = mergedAuthors.map((a) => ({
    url: `${BASE_URL}/author/${a.slug}`,
    lastModified: latestByAuthor.get(a.name) || new Date(),
    changeFrequency: 'monthly',
    priority: 0.45,
  }));

  // Country hubs: only index /countries/[country] once it actually has at
  // least one jurisdiction-specific article. An empty hub is a thin/duplicate
  // page for crawlers, not a real destination -- see Phase N of the SEO plan.
  const countryCounts = await getCountryArticleCounts();
  const populatedCountries = COUNTRIES.filter((c) => (countryCounts[c.slug] || 0) > 0);
  const countryRoutes: MetadataRoute.Sitemap = populatedCountries.length
    ? [
        { url: `${BASE_URL}/countries`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 0.6 },
        ...populatedCountries.map((c) => ({
          url: `${BASE_URL}/countries/${c.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.55,
        })),
      ]
    : [];

  return [
    ...staticRoutes,
    ...articleRoutes,
    ...categoryRoutes,
    ...authorRoutes,
    ...countryRoutes,
  ];
}

const getCachedSitemapEntries = unstable_cache(
  buildSitemapEntries,
  ['law-elite-network-sitemap-entries'],
  { revalidate: 1800 },
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getCachedSitemapEntries();
}
