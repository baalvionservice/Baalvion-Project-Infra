/**
 * Canonical site URL helper.
 *
 * All SEO surfaces (metadataBase, canonicals, OpenGraph, robots, sitemap)
 * derive their absolute base from this single source of truth.
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_APP_URL (set per-environment, e.g. http://localhost:3034 in dev)
 *  2. Production fallback (controlthemarket.com)
 *
 * The value is normalised to drop any trailing slash so callers can safely
 * concatenate paths like `${getSiteUrl()}/about`.
 */
// Must be the host that actually SERVES, not the one we would prefer to brand with. Production
// 307-redirects the apex to www, so declaring the apex here pointed every canonical, the robots
// Host/Sitemap lines and every <loc> in the sitemap at URLs that redirect — a sitemap of
// redirects plus a canonical aimed at one. If the apex→www redirect is ever removed at the edge,
// change this back to the apex in the same commit.
const PRODUCTION_FALLBACK = 'https://www.controlthemarket.com';

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const base = raw && raw.length > 0 ? raw : PRODUCTION_FALLBACK;
  return base.replace(/\/+$/, '');
}

/** Build an absolute URL for a given path using the resolved site base. */
export function absoluteUrl(path = '/'): string {
  const normalisedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl()}${normalisedPath}`;
}
