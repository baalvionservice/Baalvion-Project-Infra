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
// list): shrunk from 16 to 5, then to 3 (maritime-offshore-injury-law,
// cruise-ship-passenger-vessel-accidents, personal-injury-lawyer), then the
// LEN master-IA build added 'law-school-success' and 5 entertainment hubs
// (movies, music, television, streaming, celebrity-news) alongside those 3 --
// none of that additional build was part of the original AdSense-retirement
// restore-later list.
//
// 2026-09-25: none of that has cleared AdSense review yet, and the site kept
// growing (Fashion, Sports, the wider Entertainment/People layers) while
// still mid-review -- the exact failure mode documented in
// law-elite-hold-deploy-until-adsense. Narrowed to Fashion alone first, then
// the original 3 personal-injury/maritime-injury categories plus
// law-school-success were explicitly asked back in the same pass -- all real,
// finished content, none thin, none attributed to a fabricated bio. Movies,
// music, television, streaming, celebrity-news, and every other retired
// pillar (Entertainment hub, Sports, People, Countries, Topics, Legal
// cases/courts) stay out. Videos and Podcasts were never retired (see
// next.config.ts / sitemap.ts). Every slug removed here still exists with
// real content -- this list controls indexing/nav/sitemap eligibility, not
// deletion -- and gets restored once AdSense approves the site as it stands.
//
// 2026-09-27, follow-up after the third rejection: Fashion removed too --
// despite being the very first category kept above, it never got real
// content and is still a "DESIGN PREVIEW... every story below is
// placeholder content" page with fake headlines. That's fine unlinked, but
// this pass is specifically about not shipping the accumulated gap between
// this branch and what's live, so it comes out alongside Videos/Podcasts/
// Interviews (see next.config.ts) rather than going live as a real nav item
// pointing at placeholder copy. Restore once it has real articles.
export const CURRENT_CATEGORY_SLUGS = [
  'personal-injury-lawyer',
  'maritime-offshore-injury-law',
  'cruise-ship-passenger-vessel-accidents',
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
