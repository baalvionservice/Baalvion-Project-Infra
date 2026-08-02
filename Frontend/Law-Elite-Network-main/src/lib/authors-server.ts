import { LAW_AUTHORS, authorNameToSlug, type LawAuthor } from '@/data/authors';
import { cmsGetAuthors, cmsGetAuthorBySlug, type CmsAuthor } from '@/lib/cms';

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
    social: a.social,
  };
}

export async function getMergedAuthors(): Promise<LawAuthor[]> {
  const cms = await cmsGetAuthors().catch(() => []);
  const bySlug = new Map<string, LawAuthor>();
  LAW_AUTHORS.forEach((a) => bySlug.set(a.slug, a));
  cms.forEach((a) => bySlug.set(a.slug, fromCms(a)));
  return Array.from(bySlug.values());
}

export async function getMergedAuthorBySlug(slug: string): Promise<LawAuthor | null> {
  const cms = await cmsGetAuthorBySlug(slug).catch(() => null);
  if (cms) return fromCms(cms);
  return LAW_AUTHORS.find((a) => a.slug === slug) ?? null;
}

export async function getMergedAuthorByName(name: string): Promise<LawAuthor | null> {
  if (!name) return null;
  return getMergedAuthorBySlug(authorNameToSlug(name));
}
