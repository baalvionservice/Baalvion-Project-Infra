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

/**
 * KNOWN ISSUE — soft 404s on invalid slugs.
 *
 * An unknown slug on a dynamic route (/ships/<bad>, /companies/<bad>, /flags/<bad>/<type>)
 * renders the not-found page but returns HTTP 200, not 404. Verified in a production
 * build, so it is not a dev artifact. Calling notFound() from generateMetadata instead of
 * returning a metadata object does not change it either: generateMetadata resolving
 * successfully appears to commit the 200 before the component throws.
 *
 * MITIGATION ALREADY IN PLACE: every not-found path returns
 * `robots: { index: false, follow: true }`, so these pages are not indexed. Nothing links
 * to an invalid slug and the sitemap contains only valid ones, so the residual cost is
 * Search Console soft-404 reports and a little wasted crawl — not lost rankings.
 *
 * If this is picked up again, the thing to test is a `middleware` that validates the slug
 * before the route renders, which is the only layer that can set a status early enough.
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
