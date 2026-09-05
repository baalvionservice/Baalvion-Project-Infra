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

export const revalidate = 86400;

export async function GET() {
  // One row each, purely to learn the totals — the entries themselves are served by the
  // chunk routes.
  const [companies, vessels] = await Promise.all([
    getSitemapEntries('companies', { limit: 1 }),
    getSitemapEntries('vessels', { limit: 1 }),
  ]);

  const files: { path: string; lastmod?: string | null }[] = [
    { path: 'sitemaps/core.xml' },
  ];

  const companyTotal = companies?.total ?? 0;
  for (let i = 0; i * URLS_PER_CHUNK < Math.max(companyTotal, 1); i += 1) {
    files.push({ path: `sitemaps/companies-${i}.xml`, lastmod: companies?.data[0]?.lastmod ?? null });
  }

  const vesselTotal = vessels?.total ?? 0;
  for (let i = 0; i * URLS_PER_CHUNK < Math.max(vesselTotal, 1); i += 1) {
    files.push({ path: `sitemaps/ships-${i}.xml`, lastmod: vessels?.data[0]?.lastmod ?? null });
  }

  // The type hubs are few enough to ride in core.xml; referenced here only so the count
  // below is honest about what the index covers.
  void VESSEL_TYPE_LABELS;

  return xmlResponse(sitemapIndex(files));
}
