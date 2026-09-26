import { ACTIVE_LAW_AUTHORS, authorNameToSlug, type LawAuthor } from '@/data/authors';
import { cmsGetAuthors, cmsGetAuthorBySlug, cmsGetArticles, type CmsAuthor } from '@/lib/cms';
import { mergeArticles } from '@/data/law-content';
import { CURRENT_CATEGORY_SLUGS, toNewCategorySlug } from '@/lib/category-slugs';

/**
 * Server-side author directory that actually merges CMS-managed contributors
 * into the bundled baseline (CMS wins by slug), instead of leaving the CMS
 * fetch as a client-only add-on. Two consequences of not doing this:
 *   1. Any article bylined to a CMS-only author fell back to the generic
 *      "Law Elite Network editorial team" credit on the article page itself
 *      (`getAuthorByName` in @/data/authors only ever checks the bundled 11),
 *      even though a full profile with real credentials exists.
 *   2. /authors and /author/[slug] only picked up CMS-only contributors after
 *      client-side hydration, so they were invisible to non-JS crawlers.
 */
function fromCms(a: CmsAuthor): LawAuthor {
  return {
    slug: a.slug,
    name: a.name,
    title: a.title || '',
    credentials: a.credentials || '',
    bio: a.bio || '',
    expertise: a.expertise || [],
    avatarSeed: a.slug,
    avatarUrl: a.avatarUrl,
    education: a.education,
    certifications: a.certifications,
    social: a.social,
  };
}

export async function getMergedAuthors(): Promise<LawAuthor[]> {
  const cms = await cmsGetAuthors().catch(() => []);
  const bySlug = new Map<string, LawAuthor>();
  ACTIVE_LAW_AUTHORS.forEach((a) => bySlug.set(a.slug, a));
  cms.forEach((a) => bySlug.set(a.slug, fromCms(a)));
  return Array.from(bySlug.values());
}

export async function getMergedAuthorBySlug(slug: string): Promise<LawAuthor | null> {
  const bundled = ACTIVE_LAW_AUTHORS.find((a) => a.slug === slug) ?? null;
  try {
    const cms = await cmsGetAuthorBySlug(slug, true);
    if (cms) return fromCms(cms);
  } catch (err) {
    // CMS unreachable. A bundled profile still renders fine (degrade
    // silently, same as before); with no bundled fallback either, we can't
    // tell "this author doesn't exist" from "CMS is down right now" -- throw
    // instead of returning null so the caller's notFound() doesn't lock in a
    // false 404 for a profile that was working moments ago.
    if (!bundled) throw err;
  }
  return bundled;
}

export async function getMergedAuthorByName(name: string): Promise<LawAuthor | null> {
  if (!name) return null;
  return getMergedAuthorBySlug(authorNameToSlug(name));
}

/**
 * Article count per author slug, counting only articles whose category is
 * still live (matches author/[slug]/page.tsx and sitemap.ts's own filter --
 * a slug with only retired-category work shows "No published guides yet" on
 * its own profile, so it must not count as published here either). Single
 * source of truth for "does this contributor actually have visible work" --
 * reused by /authors (hide empty profiles from the directory, not just
 * noindex their pages) and /advertise (a real contributor count, not
 * headcount including profiles with nothing published).
 */
export async function getPublishedArticleCountsByAuthorSlug(): Promise<Map<string, number>> {
  const cmsArticles = await cmsGetArticles().catch(() => []);
  const currentSlugSet = new Set<string>(CURRENT_CATEGORY_SLUGS);
  const isKeptCategoryArticle = (a: { category?: { slug?: string } }): boolean => {
    const rawSlug = a.category?.slug;
    return !rawSlug || currentSlugSet.has(toNewCategorySlug(rawSlug));
  };
  const counts = new Map<string, number>();
  mergeArticles(cmsArticles)
    .filter(isKeptCategoryArticle)
    .forEach((a) => {
      const slug = authorNameToSlug(a.author);
      if (slug) counts.set(slug, (counts.get(slug) || 0) + 1);
    });
  return counts;
}
