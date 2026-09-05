/**
 * @file sitemaps/[file]/route.ts
 * @description The sitemap chunks the index points at.
 *
 * Three shapes, all served here so the chunking rule lives in one place:
 *   core.xml         the hubs — front page, indexes, every vessel type, every country
 *   companies-N.xml  40,000 company URLs per file
 *   ships-N.xml      40,000 vessel URLs per file
 *
 * `file` is parsed against a strict pattern and anything else 404s. It selects a query
 * and an offset, so a permissive parse here would be an open invitation to enumerate the
 * registry a page at a time with arbitrary offsets.
 */
import { notFound } from 'next/navigation';
import {
  getSitemapEntries, getCountries, getStats, listCohorts, VESSEL_TYPE_LABELS,
} from '@/lib/shipping-directory/api';
import { urlSet, xmlResponse, URLS_PER_CHUNK, type SitemapUrl } from '@/lib/shipping-directory/sitemap-xml';

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

const CHUNK_PATTERN = /^(companies|ships)-(\d{1,3})\.xml$/;

async function coreUrls(): Promise<SitemapUrl[]> {
  const [countries, stats, builders, flags, crosses] = await Promise.all([
    getCountries(), getStats(), listCohorts('builder'), listCohorts('flag'), listCohorts('flag_type'),
  ]);
  const lastmod = stats?.totals.last_ingested_at ?? null;

  const urls: SitemapUrl[] = [
    { path: '', changefreq: 'daily', priority: 1.0, lastmod },
    { path: 'companies', changefreq: 'daily', priority: 0.9, lastmod },
    { path: 'ships', changefreq: 'daily', priority: 0.9, lastmod },
    { path: 'rankings', changefreq: 'weekly', priority: 0.9, lastmod },
    { path: 'countries', changefreq: 'weekly', priority: 0.8, lastmod },
    { path: 'builders', changefreq: 'weekly', priority: 0.8, lastmod },
    { path: 'flags', changefreq: 'weekly', priority: 0.8, lastmod },
    // Superlative rankings — the head queries of this niche, where the free competition
    // is prose with a handful of examples rather than a sourced table.
    { path: 'largest', changefreq: 'weekly', priority: 0.9, lastmod },
    { path: 'oldest', changefreq: 'weekly', priority: 0.7, lastmod },
  ];

  // 1,165 shipbuilder and 212 flag-state hubs. These are the pages with real list intent
  // behind them ("Panama flagged ships", "ships built by Hyundai") and until now they
  // existed only as filtered search views carrying noindex.
  for (const b of builders ?? []) {
    if (!b.slug || !b.n) continue;
    urls.push({ path: `builders/${b.slug}`, changefreq: 'monthly', priority: 0.6, lastmod });
  }
  for (const f of flags ?? []) {
    if (!f.slug || !f.n) continue;
    urls.push({ path: `flags/${f.slug}`, changefreq: 'monthly', priority: 0.6, lastmod });
  }
  // The flag x type cross-cut. Its slug is already two segments (<flag>/<type>), so it
  // slots straight under /flags/. Only pairs clearing the 25-vessel floor have a cohort
  // row, so a thin pair is absent here by construction rather than by a filter.
  for (const c of crosses ?? []) {
    if (!c.slug || !c.n) continue;
    urls.push({ path: `flags/${c.slug}`, changefreq: 'monthly', priority: 0.6, lastmod });
  }

  // A type hub is only listed once at least one vessel carries that type — a sitemap
  // entry for an empty page is a crawl budget spent to learn nothing.
  for (const t of stats?.byType ?? []) {
    if (!Object.prototype.hasOwnProperty.call(VESSEL_TYPE_LABELS, t.vessel_type)) continue;
    if (!t.n) continue;
    urls.push({ path: `ships/type/${t.vessel_type}`, changefreq: 'weekly', priority: 0.7, lastmod });
    // A per-type ranking only exists where the type does; 'other' has no page.
    if (t.vessel_type !== 'other') {
      urls.push({ path: `largest/${t.vessel_type}`, changefreq: 'weekly', priority: 0.7, lastmod });
      urls.push({ path: `oldest/${t.vessel_type}`, changefreq: 'monthly', priority: 0.5, lastmod });
    }
  }

  for (const c of countries ?? []) {
    if (!c.country_code) continue;
    urls.push({ path: `countries/${c.country_code.toLowerCase()}`, changefreq: 'weekly', priority: 0.7, lastmod });
  }

  return urls;
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;

  if (file === 'core.xml') {
    return xmlResponse(urlSet(await coreUrls()));
  }

  const match = CHUNK_PATTERN.exec(file);
  if (!match) notFound();

  const kind = match[1] === 'companies' ? 'companies' as const : 'vessels' as const;
  const index = Number(match[2]);
  const offset = index * URLS_PER_CHUNK;

  const result = await getSitemapEntries(kind, { limit: URLS_PER_CHUNK, offset });
  if (!result) notFound();
  // An offset past the end is a stale index, not a valid empty file. 404 makes that
  // visible in Search Console instead of publishing an empty urlset that reads as
  // "these pages were removed".
  if (offset > 0 && result.data.length === 0) notFound();

  const prefix = kind === 'companies' ? 'companies' : 'ships';
  const urls: SitemapUrl[] = result.data.map((row) => ({
    path: `${prefix}/${row.slug}`,
    lastmod: row.lastmod,
    changefreq: 'monthly',
    priority: kind === 'companies' ? 0.7 : 0.5,
  }));

  return xmlResponse(urlSet(urls));
}
