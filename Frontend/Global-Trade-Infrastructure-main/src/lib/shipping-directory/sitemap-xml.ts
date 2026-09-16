/**
 * @file lib/shipping-directory/sitemap-xml.ts
 * @description Sitemap serialisation for the directory.
 *
 * Hand-rolled rather than using Next's `sitemap.ts` convention, for two reasons that both
 * come from scale:
 *
 *   1. The registry is ~96,000 vessel URLs. The sitemaps protocol caps a single file at
 *      50,000 URLs and 50 MB uncompressed, so this has to be an index over chunks.
 *      Next's generateSitemaps() can chunk, but it cannot serve the index at a path the
 *      subdomain rewrite leaves alone.
 *   2. Every URL must be absolute and on the PUBLIC host. The directory is served from
 *      /shipping-directory internally and rewritten onto its own subdomain, so a sitemap
 *      built from request paths would publish the internal form and split the index.
 */
import { canonical } from './site';

/** Sitemaps cap a file at 50,000 URLs; 40,000 leaves room without a second round trip. */
export const URLS_PER_CHUNK = 40000;

export interface SitemapUrl {
  path: string;
  lastmod?: string | Date | null;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/** XML text escaping. A ship really can be called "Bow & Arrow". */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function isoDate(v: string | Date | null | undefined): string | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function urlSet(urls: SitemapUrl[]): string {
  const body = urls.map((u) => {
    const lastmod = isoDate(u.lastmod);
    return [
      '  <url>',
      `    <loc>${esc(canonical(u.path))}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      u.changefreq ? `    <changefreq>${u.changefreq}</changefreq>` : null,
      u.priority !== undefined ? `    <priority>${u.priority.toFixed(1)}</priority>` : null,
      '  </url>',
    ].filter(Boolean).join('\n');
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>`;
}

export function sitemapIndex(files: { path: string; lastmod?: string | Date | null }[]): string {
  const body = files.map((f) => {
    const lastmod = isoDate(f.lastmod);
    return [
      '  <sitemap>',
      `    <loc>${esc(canonical(f.path))}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
      '  </sitemap>',
    ].filter(Boolean).join('\n');
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>`;
}

/**
 * Cached for an hour at the edge, a day in a shared cache.
 *
 * A sitemap is fetched by crawlers, not by people, and rebuilding a 40,000-URL document
 * per request would let a crawler's own politeness schedule act as load.
 */
export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
