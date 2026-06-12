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
const PRODUCTION_FALLBACK = 'https://controlthemarket.com';

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
