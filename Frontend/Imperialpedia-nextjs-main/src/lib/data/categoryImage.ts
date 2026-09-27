/**
 * Real, self-hosted photography for the World section (public/images/world),
 * keyed by story category. Replaces the generated-SVG-artwork fallback with
 * actual photographs — same-origin, so nothing is hotlinked and the existing
 * CSP (`img-src 'self' ...`) needs no changes.
 */

const CATEGORY_IMAGE: Record<string, string> = {
  MARKETS: "/images/world/categories/markets.jpg",
  TECH: "/images/world/categories/tech.jpg",
  ECONOMY: "/images/world/categories/economy.jpg",
  POLITICS: "/images/world/categories/politics.jpg",
  ENERGY: "/images/world/categories/energy.jpg",
  CRYPTO: "/images/world/categories/crypto.jpg",
  WORLD: "/images/world/categories/world.jpg",
  RETAIL: "/images/world/categories/retail.jpg",
  HEALTH: "/images/world/categories/health.jpg",
  AUTO: "/images/world/categories/auto.jpg",
};

/** Category-photo lookup with a sane default for unmapped/unknown categories.
 * Matches by substring (not just exact key) so section labels like
 * "Energy & Climate" or "Politics & Policy" still resolve correctly. */
export function categoryImage(category: string): string {
  const key = category.toUpperCase();
  if (CATEGORY_IMAGE[key]) return CATEGORY_IMAGE[key];
  const match = Object.keys(CATEGORY_IMAGE).find((k) => key.includes(k));
  return match ? CATEGORY_IMAGE[match] : "/images/world/categories/world.jpg";
}
