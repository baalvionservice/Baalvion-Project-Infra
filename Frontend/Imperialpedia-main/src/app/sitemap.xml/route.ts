import { sitemapService } from "@/modules/seo/services/sitemap-service";
import { NextResponse } from "next/server";

/**
 * Dynamic Route handler for sitemap.xml (Main Index).
 * Points crawlers to the individual segment sitemaps for at-scale indexing.
 */
export async function GET() {
  try {
    const sitemap = await sitemapService.regenerateSitemap();

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
