import { getAllArticles, type LawArticle } from './law-content';
import { cmsGetArticles, type CmsArticle } from '@/lib/cms';

export interface Country {
  name: string;
  slug: string;
}

/**
 * Canonical country list for the /countries section. Informal slugs (not ISO
 * codes) to match how they'd naturally appear in a URL. No article carries a
 * country yet (see LawArticle.country / CmsArticle.country) -- this section
 * ships empty and gets built out as jurisdiction-specific content is added.
 */
export const COUNTRIES: Country[] = [
  { name: 'United States', slug: 'usa' },
  { name: 'United Kingdom', slug: 'uk' },
  { name: 'Canada', slug: 'canada' },
  { name: 'Australia', slug: 'australia' },
  { name: 'India', slug: 'india' },
  { name: 'Singapore', slug: 'singapore' },
  { name: 'United Arab Emirates', slug: 'uae' },
  { name: 'Germany', slug: 'germany' },
];

export function getCountryBySlug(slug: string): Country | null {
  return COUNTRIES.find((c) => c.slug === slug) ?? null;
}

export function countryNameToSlug(name: string): string | null {
  const match = COUNTRIES.find((c) => c.name.toLowerCase() === name.toLowerCase());
  return match ? match.slug : null;
}

/**
 * Bundled + CMS articles tagged with the given country, CMS-wins-by-slug --
 * mirrors the merge pattern in CategoryContent.tsx / law-content.ts's
 * mergeArticles().
 *
 * Country membership is decided from EITHER source's `country` field, not
 * just the winning (CMS) record's own -- editing a bundled article's slug in
 * the CMS admin (e.g. to attach a real featured image) doesn't always carry
 * customFields.country along with it. Gating purely on the CMS record's own
 * tag silently dropped the country match and fell back to the imageless
 * bundled version even once a real photo had been uploaded for that same
 * slug.
 */
export async function getArticlesByCountrySlug(countrySlug: string): Promise<Array<LawArticle | CmsArticle>> {
  const country = getCountryBySlug(countrySlug);
  if (!country) return [];

  const bundled = getAllArticles();
  const cms = await cmsGetArticles();
  const cmsBySlug = new Map(cms.map((a) => [a.slug, a]));
  const bundledBySlug = new Map(bundled.map((a) => [a.slug, a]));

  const isCountryMatch = (a: { country?: string | null } | undefined) =>
    !!a?.country && countryNameToSlug(a.country) === countrySlug;

  const slugs = new Set([
    ...bundled.filter(isCountryMatch).map((a) => a.slug),
    ...cms.filter(isCountryMatch).map((a) => a.slug),
  ]);

  return Array.from(slugs)
    .map((slug) => cmsBySlug.get(slug) ?? bundledBySlug.get(slug))
    .filter((a): a is LawArticle | CmsArticle => Boolean(a));
}

/** Article count per country, for the /countries index. */
export async function getCountryArticleCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  await Promise.all(
    COUNTRIES.map(async (c) => {
      counts[c.slug] = (await getArticlesByCountrySlug(c.slug)).length;
    }),
  );
  return counts;
}
