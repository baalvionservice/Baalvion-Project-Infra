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

// AdSense-readiness retirement (see next.config.ts redirects() for the same
// list): shrunk from 16 to 5, then narrowed further to these 3 -- the
// deepest, most purpose-built content in the personal-injury/maritime-injury
// vertical (dedicated pillar pages, geo-targeted content), verified not
// attributed to any of the fabricated-bio authors that triggered the
// rejection. Boating Accidents and Car Accidents (shallower, 4 and 2
// articles) were retired in the same pass as the other 11 (business,
// criminal-law, family-law, real-estate-law, tax-finance, employment-law,
// tech-ip, disputes, us-law-and-constitution, religion-law-and-weird-laws,
// legal-education-and-history) -- none deleted, this list is what to restore
// once resubmission succeeds.
// 'law-school-success' added September 2026 -- a new evergreen vertical
// aimed at law students (study skills, casebook reading, exam prep), not
// part of the AdSense-retirement narrowing above -- kept separate from that
// list's restore-later intent.
export const CURRENT_CATEGORY_SLUGS = [
  'maritime-offshore-injury-law',
  'cruise-ship-passenger-vessel-accidents',
  'personal-injury-lawyer',
  'law-school-success',
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
