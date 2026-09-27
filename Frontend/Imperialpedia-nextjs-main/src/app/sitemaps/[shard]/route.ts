import { sitemapService } from "@/modules/seo/services/sitemap-service";
import { NextResponse } from "next/server";

// Each shard is a standard <urlset> of up to 45,000 URLs, referenced by the
// sitemap index at /sitemap.xml. Revalidated hourly; cleared on publish.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

/**
 * /sitemaps/{n}.xml — a single sharded url-set. `n` is the 0-based shard index.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shard: string }> },
) {
  const { shard } = await params;
  const match = /^(\d+)\.xml$/.exec(shard);
  if (!match) {
    return new Response("Not found", { status: 404 });
  }

  const xml = await sitemapService.buildShard(Number(match[1]));
  if (xml === null) {
    return new Response("Sitemap shard out of range", { status: 404 });
  }

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
