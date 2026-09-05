/**
 * @file lib/shipping-directory/site.ts
 * @description One source of truth for the directory's public identity and URLs.
 *
 * The directory is served two ways and this is the only file that should know it:
 *
 *   ships.example.com/companies/maersk        ← the canonical public form
 *   trade.example.com/shipping-directory/…    ← the internal path, used in development
 *
 * middleware.ts rewrites the first onto the second and redirects anyone who reaches the
 * internal prefix ON the directory host back to the short form, so there is exactly one
 * address per page. Everything that must be absolute — canonical tags, Open Graph URLs,
 * sitemap entries, JSON-LD @id values — has to use the PUBLIC form, or every page
 * self-canonicalises to a second hostname and the two compete in the index.
 *
 * `href()` stays relative and keeps the internal prefix, because in-app navigation is
 * resolved against whichever host is actually serving the request.
 */

/** Public origin of the directory. No trailing slash. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SHIPPING_DIRECTORY_URL
  || process.env.SHIPPING_DIRECTORY_URL
  || 'https://ships.baalvion.com'
).replace(/\/+$/, '');

export const SITE_NAME = 'World Shipping Directory';
export const PUBLISHER = 'Baalvion';

/** Internal route prefix. Must match SHIPPING_DIRECTORY_PREFIX in middleware.ts. */
const PREFIX = '/shipping-directory';

/** An in-app link. Relative, prefixed, host-agnostic. */
export function href(path = ''): string {
  const clean = path.replace(/^\/+/, '');
  return clean ? `${PREFIX}/${clean}` : PREFIX;
}

/**
 * The absolute, canonical URL of a directory page — the short form on the public host,
 * with the internal prefix stripped. Passed to `alternates.canonical`, the sitemap and
 * every JSON-LD `@id`.
 */
export function canonical(path = ''): string {
  const clean = path.replace(/^\/+/, '').replace(/^shipping-directory\/?/, '');
  return clean ? `${SITE_URL}/${clean}` : SITE_URL;
}

/**
 * Wikimedia file URLs point at the full-size original, which for ship photography is
 * routinely a 10-20 MB scan. Special:FilePath honours `?width=`, returning a rendered
 * thumbnail from the same URL — so widths are requested rather than downloading an
 * original and letting the browser scale it.
 *
 * SVGs are the exception: asking for a width rasterises a logo that would otherwise
 * scale perfectly, so they are passed through untouched.
 */
export function commonsImage(url: string | null | undefined, width = 800): string | null {
  if (!url) return null;
  const https = url.replace(/^http:\/\//, 'https://');
  if (!https.includes('Special:FilePath')) return https;
  if (/\.svg(\?|$)/i.test(https)) return https;
  return `${https}${https.includes('?') ? '&' : '?'}width=${width}`;
}
