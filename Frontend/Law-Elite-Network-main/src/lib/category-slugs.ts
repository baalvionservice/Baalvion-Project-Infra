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
// law-culture-and-society). THESE ARE EMPTY as of this change -- zero
// published articles in any of them. They're listed here (and in
// site-nav.ts's PRIMARY_NAV) so the pages render instead of 404ing, per the
// [categorySlug]/page.tsx fetchCategory() gate below, not because they're
// launch-ready. Do not resubmit to AdSense or treat this site as fully live
// until each has real, non-fabricated published articles -- an empty-but-
// linked category was exactly the failure mode in the prior rejections.
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
