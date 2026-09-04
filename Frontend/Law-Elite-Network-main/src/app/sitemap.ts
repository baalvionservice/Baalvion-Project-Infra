import { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import { getAllArticles, mergeArticles } from '@/data/law-content';
import { getMergedAuthors } from '@/lib/authors-server';
import { authorNameToSlug } from '@/data/authors';
import { articleUrl, ROOT_FLAT_ARTICLE_SLUGS } from '@/lib/article-url';
import { CURRENT_CATEGORY_SLUGS, toNewCategorySlug } from '@/lib/category-slugs';
import { cmsGetArticles } from '@/lib/cms';

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
 *
 * No changeFrequency/priority anywhere in this file: Google has stated for
 * years it ignores both, and Bing mostly does too -- they added file weight
 * and a false sense of per-page precision without affecting crawl behavior.
 * lastModified is the only sitemap hint worth emitting, and only where a real
 * date is known (see the omission comments below).
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

  // No lastModified on these: they're hardcoded marketing/policy routes with
  // no CMS-tracked edit timestamp anywhere in the data model (CmsSitePage has
  // no updatedAt field) -- stamping `new Date()` here would report "changed
  // right now" on every cache rebuild regardless of whether the page content
  // actually changed, which is a fabricated signal, not a real one. Omitting
  // lastModified is valid per the sitemap spec and honest given what we
  // actually know. /search is excluded entirely: it's a utility/results page,
  // not indexable content.
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/` },
    { url: `${BASE_URL}/news` },
    { url: `${BASE_URL}/case-law` },
    { url: `${BASE_URL}/legislation` },
    { url: `${BASE_URL}/law-changes` },
    { url: `${BASE_URL}/about-us` },
    { url: `${BASE_URL}/authors` },
    { url: `${BASE_URL}/editorial-standards` },
    { url: `${BASE_URL}/corrections` },
    { url: `${BASE_URL}/contact-us` },
    { url: `${BASE_URL}/careers` },
    { url: `${BASE_URL}/advertise` },
    { url: `${BASE_URL}/editorial-process` },
    { url: `${BASE_URL}/policies` },
    { url: `${BASE_URL}/privacy-policy` },
    { url: `${BASE_URL}/terms-of-service` },
    { url: `${BASE_URL}/editorial-disclosure-policy` },
    { url: `${BASE_URL}/cookie-policy` },
    { url: `${BASE_URL}/diversity-policy` },
    { url: `${BASE_URL}/accessibility` },
    { url: `${BASE_URL}/conflict-of-interest-policy` },
    { url: `${BASE_URL}/sponsored-content-policy` },
    { url: `${BASE_URL}/comment-policy` },
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
  // Slugs that next.config.ts permanently redirects away from -- their CMS
  // rows are still `published` (real, unmerged content), so they'd otherwise
  // resurface here as a submitted URL that immediately 308s, which Search
  // Console flags. Keep in sync with next.config.ts's redirects() sources.
  const REDIRECTED_ARTICLE_SLUGS = new Set([
    'cruise-ship-accident-lawyer-florida',
    'navigating-the-divorce-process',
  ]);

  // AdSense-readiness retirement: CURRENT_CATEGORY_SLUGS shrank from 16 to 5
  // (see category-slugs.ts), but articleUrl() doesn't stop resolving a
  // retired-category article -- it just falls back to the still-live
  // /article/{slug} URL (or, for a handful of ex-ROOT_FLAT_ARTICLE_SLUGS
  // entries, would have stayed at an unprefixed root URL). Unfiltered, this
  // map would keep submitting every one of those to Google. An article is
  // sitemap-eligible only if its category (after the same old->new
  // normalization every other route applies) is still current, or it never
  // had a category at all and is one of the small, explicit standalone pages
  // in ROOT_FLAT_ARTICLE_SLUGS -- everything else is a retired-category
  // article temporarily reachable only at /article/{slug}, not something to
  // actively resubmit to Google.
  const currentSlugSetForArticles = new Set<string>(CURRENT_CATEGORY_SLUGS);
  const isSitemapEligible = (a: ArticleEntry): boolean => {
    const rawSlug = a.category?.slug;
    if (rawSlug) return currentSlugSetForArticles.has(toNewCategorySlug(rawSlug));
    return !!a.slug && ROOT_FLAT_ARTICLE_SLUGS.has(a.slug);
  };

  const articleEntries = new Map<string, { url: string; lastModified: Date }>();
  getAllArticles().forEach((a) => {
    if (!isSitemapEligible(a)) return;
    articleEntries.set(a.slug, {
      url: `${BASE_URL}${articleUrl(a)}`,
      lastModified: new Date(a.updatedAt || Date.now()),
    });
  });
  articles.forEach((a) => {
    if (!isSitemapEligible(a)) return;
    articleEntries.set(a.slug, {
      url: `${BASE_URL}${articleUrl(a)}`,
      lastModified: new Date(a.updated_at || a.updatedAt || Date.now()),
    });
  });
  cmsArticles.forEach((a) => {
    if (!isSitemapEligible(a)) return;
    articleEntries.set(a.slug, {
      url: `${BASE_URL}${articleUrl(a)}`,
      lastModified: new Date(a.updatedAt || Date.now()),
    });
  });

  REDIRECTED_ARTICLE_SLUGS.forEach((slug) => articleEntries.delete(slug));

  const articleRoutes: MetadataRoute.Sitemap = Array.from(articleEntries.values()).map((entry) => ({
    url: entry.url,
    lastModified: entry.lastModified,
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
      })),
    // No lastModified here: the API didn't return this slug, so there's no
    // real updated_at to report -- omit rather than fabricate "now".
    ...CURRENT_CATEGORY_SLUGS.filter((slug) => !apiCategorySlugs.has(slug)).map((slug) => ({
      url: `${BASE_URL}/${slug}`,
    })),
  ];

  // Author profile pages — one per contributor for E-E-A-T discoverability,
  // but only once they actually have at least one attributed article. A
  // zero-article author page is a near-empty doorway page (photo + one
  // templated sentence + no content) -- same reasoning as the empty-country-hub
  // filter below. Confirmed live: 56 of 103 merged authors (mostly the bulk-
  // seeded international profiles) currently have zero articles and were
  // being actively submitted to Google. Article-per-author matching mirrors
  // src/app/author/[slug]/page.tsx exactly (mergeArticles + authorNameToSlug,
  // both also excluding retired-category articles the same way) so this
  // filter agrees with what the page itself would render -- otherwise an
  // author whose only work is in a retired category would still get a
  // sitemap entry for a page that now shows "No published guides yet".
  const isKeptCategoryArticle = (a: { category?: { slug?: string } }): boolean => {
    const rawSlug = a.category?.slug;
    return !rawSlug || currentSlugSetForArticles.has(toNewCategorySlug(rawSlug));
  };
  const mergedArticlesForCount = mergeArticles(cmsArticles).filter(isKeptCategoryArticle);
  const articleCountByAuthorSlug = new Map<string, number>();
  mergedArticlesForCount.forEach((a) => {
    const slug = authorNameToSlug(a.author);
    articleCountByAuthorSlug.set(slug, (articleCountByAuthorSlug.get(slug) || 0) + 1);
  });

  // lastModified tracks the author's most recently updated bundled article
  // (authors have no timestamp of their own) rather than the request time.
  const latestByAuthor = new Map<string, Date>();
  getAllArticles().filter(isKeptCategoryArticle).forEach((a) => {
    const parsed = new Date(a.updatedAt);
    if (Number.isNaN(parsed.getTime())) return;
    const existing = latestByAuthor.get(a.author);
    if (!existing || parsed > existing) latestByAuthor.set(a.author, parsed);
  });

  // Merged (bundled + CMS-added) authors -- CMS-only authors were previously
  // dropped from the sitemap because this used the bundled-only getAllAuthors(),
  // even though their /author/[slug] pages render fine and are linked from /authors.
  // CMS-only authors (no bundled article) have no entry in latestByAuthor --
  // omit lastModified for those rather than fabricate "now" as a stand-in.
  const mergedAuthors = await getMergedAuthors();
  const authorRoutes: MetadataRoute.Sitemap = mergedAuthors
    .filter((a) => (articleCountByAuthorSlug.get(a.slug) || 0) > 0)
    .map((a) => {
      const lastModified = latestByAuthor.get(a.name);
      return {
        url: `${BASE_URL}/author/${a.slug}`,
        ...(lastModified && { lastModified }),
      };
    });

  return [
    ...staticRoutes,
    ...articleRoutes,
    ...categoryRoutes,
    ...authorRoutes,
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
