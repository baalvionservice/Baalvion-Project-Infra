import { sitemapService } from "@/modules/seo/services/sitemap-service";
import { NextResponse } from "next/server";

// Regenerate per request (revalidated hourly) so the sitemap reflects live published content
// (articles/news/entities) rather than a stale build-time snapshot.
export const dynamic = "force-dynamic";
export const revalidate = 3600;

/**
 * sitemap.xml — the sitemap INDEX. Points crawlers at the sharded url-sets
 * (/sitemaps/{i}.xml), each holding < 50,000 URLs per the sitemap standard,
 * so the system scales to 1M+ URLs.
 */
export async function GET() {
  try {
    const xml = await sitemapService.buildIndex();

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Sitemap index generation error:', error);
    return new Response('Error generating sitemap index', { status: 500 });
  }
}
