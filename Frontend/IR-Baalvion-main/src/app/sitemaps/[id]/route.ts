/**
 * Child sitemap chunk — https://ir.baalvion.com/sitemaps/{id}.xml
 *
 * Serves up to 50,000 URLs (the id-th slice of all indexable URLs). Referenced by
 * the sitemap index at /sitemap.xml. force-dynamic so content changes are reflected
 * on the next crawl.
 */
import { collectSitemapEntries, buildUrlsetXml, SITEMAP_CHUNK_SIZE } from '@/lib/sitemap';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = parseInt(String(id).replace(/\.xml$/i, ''), 10);
  const index = Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;

  const entries = await collectSitemapEntries();
  const slice = entries.slice(index * SITEMAP_CHUNK_SIZE, (index + 1) * SITEMAP_CHUNK_SIZE);

  return new Response(buildUrlsetXml(slice), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
