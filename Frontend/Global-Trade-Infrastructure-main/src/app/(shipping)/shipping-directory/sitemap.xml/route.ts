/**
 * @file sitemap.xml/route.ts
 * @description The directory's sitemap index.
 *
 * An index rather than a single file because the registry is ~96,000 vessel URLs and the
 * sitemaps protocol caps one file at 50,000. The chunk count is derived from the live row
 * count on every request rather than hardcoded, so a sitemap can never quietly stop
 * covering the tail of the registry after an ingest adds rows.
 *
 * On the directory's own subdomain this is reached as /sitemap.xml — middleware.ts
 * rewrites the host root onto this path, and robots.txt points here.
 */
import { getSitemapEntries, VESSEL_TYPE_LABELS } from '@/lib/shipping-directory/api';
import { sitemapIndex, xmlResponse, URLS_PER_CHUNK } from '@/lib/shipping-directory/sitemap-xml';

/**
 * NEVER PRERENDERED AT BUILD TIME.
 *
 * A sitemap is a statement about what currently exists, and it is only true if it was
 * built against a reachable registry. During `next build` inside Docker there is no
 * network route to the API, so a prerendered sitemap would bake in whatever the failed
 * call returned — which is exactly the silent truncation the guard below refuses to
 * publish. (It duly failed the build, which is how this was found.)
 *
 * `force-dynamic` moves generation to request time, where the registry is reachable.
 * Caching is not lost: xmlResponse() sets Cache-Control with s-maxage, so a CDN and the
 * crawler's own cache hold it — and a sitemap is fetched rarely by design.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 86400;

export async function GET() {
  // One row each, purely to learn the totals — the entries themselves are served by the
  // chunk routes.
  const [companies, vessels] = await Promise.all([
    getSitemapEntries('companies', { limit: 1 }),
    getSitemapEntries('vessels', { limit: 1 }),
  ]);

  /**
   * A COUNT WE COULD NOT VERIFY MUST NOT BECOME A SHORTER SITEMAP.
   *
   * These totals decide how many chunk files the index advertises. When the registry API
   * is slow or cold — which it is for the first request after a container recreate — a
   * `?? 0` here silently published a one-chunk index covering 40,000 of 95,871 vessels,
   * and ISR then cached that for a day. To a crawler a shrunken index is not an outage,
   * it is a statement that 55,871 pages were removed.
   *
   * So an unusable count throws. A 500 makes Google retry the sitemap later; a truncated
   * 200 makes it drop pages from the index.
   */
  if (!companies || !vessels) {
    throw new Error('sitemap index: registry unreachable — refusing to publish a partial index');
  }
  if (vessels.total < 1 || companies.total < 1) {
    throw new Error(
      `sitemap index: implausible totals (companies=${companies.total}, vessels=${vessels.total})`
      + ' — refusing to publish an index that would shrink the crawlable set',
    );
  }

  const files: { path: string; lastmod?: string | null }[] = [
    { path: 'sitemaps/core.xml' },
  ];

  const companyTotal = companies.total;
  for (let i = 0; i * URLS_PER_CHUNK < companyTotal; i += 1) {
    files.push({ path: `sitemaps/companies-${i}.xml`, lastmod: companies.data[0]?.lastmod ?? null });
  }

  const vesselTotal = vessels.total;
  for (let i = 0; i * URLS_PER_CHUNK < vesselTotal; i += 1) {
    files.push({ path: `sitemaps/ships-${i}.xml`, lastmod: vessels.data[0]?.lastmod ?? null });
  }

  // The type hubs are few enough to ride in core.xml; referenced here only so the count
  // below is honest about what the index covers.
  void VESSEL_TYPE_LABELS;

  return xmlResponse(sitemapIndex(files));
}
