/**
 * Sitemap INDEX for ir.baalvion.com — https://ir.baalvion.com/sitemap.xml
 *
 * Lists the chunked child sitemaps (/sitemaps/0.xml, /sitemaps/1.xml, ...). The
 * number of children grows automatically with content: 50,000 URLs per child.
 * Regenerated on every request (force-dynamic) so newly published/edited/deleted
 * content appears in near-real-time; a short s-maxage gives CDNs a 60s cache.
 */
import { AppConfig } from '@/config';
import { collectSitemapEntries, buildSitemapIndexXml, SITEMAP_CHUNK_SIZE } from '@/lib/sitemap';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const base = AppConfig.baseUrl.replace(/\/$/, '');
  const entries = await collectSitemapEntries();
  const chunks = Math.max(1, Math.ceil(entries.length / SITEMAP_CHUNK_SIZE));

  const children = Array.from({ length: chunks }, (_, i) => {
    const slice = entries.slice(i * SITEMAP_CHUNK_SIZE, (i + 1) * SITEMAP_CHUNK_SIZE);
    const last = slice.reduce(
      (max, e) => (e.lastModified > max ? e.lastModified : max),
      new Date(0)
    );
    return { url: `${base}/sitemaps/${i}.xml`, lastModified: last.getTime() ? last : new Date() };
  });

  return new Response(buildSitemapIndexXml(children), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
