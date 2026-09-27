import { cmsGetArticles } from '@/lib/cms';

/**
 * Categories live regardless of article count -- established sections with
 * real, substantial content already (not part of the 2026-09-27 repositioning's
 * "new pillar, empty until written" set). See category-slugs.ts's
 * CURRENT_CATEGORY_SLUGS comment for the full history.
 */
const ALWAYS_LIVE = new Set(['law-school-success', 'fashion']);

/**
 * A category goes live automatically (appears in nav, sitemap, and search
 * indexing) once it has at least this many published articles. Below the
 * threshold the category's own page still renders (so an editor can preview
 * it), it's just not promoted anywhere -- the same "exists but not
 * discoverable" pattern already used for retired categories, applied here
 * to categories that are new instead of retired.
 */
export const LIVE_THRESHOLD = 4;

/**
 * Published-article count per category slug, from the CMS's public content
 * feed (already filtered to published/non-archived -- see cmsGetArticles).
 * Cached for CONTENT_CACHE_TAG's revalidate window like every other CMS read
 * on this site, so a newly-published 4th article promotes the category
 * within that window without any manual nav/sitemap edit.
 */
export async function getPublishedCountsBySlug(): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  try {
    const articles = await cmsGetArticles();
    for (const a of articles) {
      const slug = a.category?.slug;
      if (!slug) continue;
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  } catch {
    // CMS unreachable -- return what we have (empty), so callers fail closed
    // to "not live yet" rather than guessing a category is ready.
  }
  return counts;
}

/**
 * The set of category slugs that should be promoted right now: always-live
 * categories, plus any other category that has crossed LIVE_THRESHOLD
 * published articles.
 */
export async function getLiveCategorySlugs(): Promise<Set<string>> {
  const live = new Set(ALWAYS_LIVE);
  const counts = await getPublishedCountsBySlug();
  for (const [slug, count] of counts) {
    if (count >= LIVE_THRESHOLD) live.add(slug);
  }
  return live;
}

/** True once `slug` has enough published articles (or is always-live) to be promoted. */
export async function isCategoryLive(slug: string): Promise<boolean> {
  if (ALWAYS_LIVE.has(slug)) return true;
  const counts = await getPublishedCountsBySlug();
  return (counts.get(slug) ?? 0) >= LIVE_THRESHOLD;
}
