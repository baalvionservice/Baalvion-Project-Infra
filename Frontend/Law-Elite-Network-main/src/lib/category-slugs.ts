/**
 * Category slug rename (URL restructure, dropping the /law/ prefix). Old
 * slugs map to new ones here; anything not listed is unchanged
 * (criminal-law, tax-finance). Single source of truth for the old-route
 * redirect shims under src/app/law/**.
 */
export const CATEGORY_SLUG_RENAME: Record<string, string> = {
  'business-corporate': 'business',
  'family-personal': 'family-law',
  'property-real-estate': 'real-estate-law',
  'employment-labor': 'employment-law',
  'technology-ip': 'tech-ip',
  'dispute-resolution': 'disputes',
};

/** Old slug -> new slug, passing unchanged slugs through as-is. */
export function toNewCategorySlug(oldSlug: string): string {
  return CATEGORY_SLUG_RENAME[oldSlug] || oldSlug;
}

// AdSense-readiness retirement history (see next.config.ts redirects() for
// the parallel list): shrunk from 16 down over several passes as the legal
// practice-area categories (personal injury, maritime, cruise ship, news)
// were archived outright 2026-09-27 for YMYL/legal-lead-gen risk -- not just
// delinked, the underlying articles are archived in the CMS. Every slug
// removed here for retirement (as opposed to archived) still exists with
// real content; this list controls indexing/nav/sitemap eligibility, not
// deletion.
//
// 2026-09-27 repositioning: five new categories added for the "publication
// about the history, culture, language and technology around law"
// direction (law-and-popular-culture, history-and-civilization,
// language-and-literature, technology-and-digital-culture,
// law-culture-and-society). Started EMPTY at creation; each now has real,
// non-fabricated published articles (5-10+ per category as of the cluster
// publishing passes later the same day -- see recent "feat(law-elite):
// publish ... cluster articles" commits). Before resubmitting to AdSense,
// re-verify actual live counts rather than trusting this comment, since it
// was already stale once (it said "empty" while the pass above shows these
// were already populated).
export const CURRENT_CATEGORY_SLUGS = [
  'law-school-success',
  'law-and-popular-culture',
  'history-and-civilization',
  'language-and-literature',
  'technology-and-digital-culture',
  'law-culture-and-society',
] as const;

/** Every slug the /law/{slug} URL shape ever used, for validating old redirect requests. */
export const OLD_CATEGORY_SLUGS = new Set([
  'business-corporate',
  'criminal-law',
  'family-personal',
  'property-real-estate',
  'tax-finance',
  'employment-labor',
  'technology-ip',
  'dispute-resolution',
]);
