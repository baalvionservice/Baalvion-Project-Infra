/**
 * Mirrors Frontend/Law-Elite-Network-main/src/lib/category-slugs.ts's
 * CATEGORY_SLUG_RENAME + CURRENT_CATEGORY_SLUGS so the admin categories page
 * can flag which CMS category rows for law-elite-network are actually live
 * on the site vs. only present in the database (retired/orphaned). Keep in
 * sync by hand if either source ever changes — same tradeoff already made by
 * cms-service/scripts/archive-law-elite-retired-categories.cjs's own copy.
 */
export const LEN_WEBSITE_SLUG = 'law-elite-network';

const CATEGORY_SLUG_RENAME: Record<string, string> = {
  'business-corporate': 'business',
  'family-personal': 'family-law',
  'property-real-estate': 'real-estate-law',
  'employment-labor': 'employment-law',
  'technology-ip': 'tech-ip',
  'dispute-resolution': 'disputes',
};

const LEN_LIVE_CATEGORY_SLUGS = new Set<string>([
  'maritime-offshore-injury-law',
  'cruise-ship-passenger-vessel-accidents',
  'personal-injury-lawyer',
  'law-school-success',
  'movies',
  'music',
  'television',
  'streaming',
  'celebrity-news',
]);

export function isLenCategorySlugLive(slug: string): boolean {
  const normalized = CATEGORY_SLUG_RENAME[slug] || slug;
  return LEN_LIVE_CATEGORY_SLUGS.has(normalized);
}
