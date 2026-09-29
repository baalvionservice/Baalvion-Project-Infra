/**
 * @fileOverview Centralized branded placeholder assets for Baalvion Mining Inc.
 *
 * Replaces all external `picsum.photos` / random-stock image usage with locally
 * hosted, branded, mining-themed SVG placeholders served from `/public/images/`.
 *
 * TODO(business): These are TEMPORARY branded placeholders. Replace with final
 * licensed photography supplied by the company — real mine sites, mineral samples,
 * facilities, equipment, logistics, and leadership/team photos. Keep the same keys
 * so call sites do not need to change.
 */

export const BRAND_IMAGES = {
  /** Home hero — industrial trading visual */
  hero: '/images/hero/trading-hero.svg',
  /** Global reach / network section */
  globalNetwork: '/images/logistics/global-network.svg',
  /** Logistics & freight partners */
  logistics: '/images/logistics/freight-network.svg',
  /** Generic mineral / commodity sample (marketplace, products) */
  mineral: '/images/minerals/mineral-sample.svg',
  /** Corporate / company surfaces (about, company) */
  company: '/images/company/corporate.svg',
  /** Editorial / blog / insight cover */
  insight: '/images/company/insight-cover.svg',
  /** Knowledge-hub guide / report cover */
  guide: '/images/company/guide-cover.svg',
  /** Default social-share / Open Graph fallback */
  ogDefault: '/images/og/og-default.svg',
} as const;

export type BrandImageKey = keyof typeof BRAND_IMAGES;

/**
 * Returns a branded placeholder image path for a given content category.
 * Use instead of building `picsum.photos/seed/...` URLs.
 */
export function placeholderImage(category: BrandImageKey = 'mineral'): string {
  return BRAND_IMAGES[category];
}

/** Absolute-URL helper for metadata / schema (Open Graph requires absolute URLs). */
export function absoluteBrandImage(
  category: BrandImageKey,
  baseUrl = 'https://mining.baalvion.com',
): string {
  return `${baseUrl}${BRAND_IMAGES[category]}`;
}
