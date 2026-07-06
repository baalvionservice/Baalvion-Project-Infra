import { NextResponse } from "next/server";
import { listCmsContent, cmsContentToNews } from "@/services/data/cms-public";

const PAGE_SIZE = 12;

/**
 * Same-origin pagination proxy for the /news infinite-scroll feed. Keeps the
 * cms-service call server-side (consistent regardless of whether the CMS base
 * URL is publicly exposed) and avoids cross-origin fetches from the browser.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  try {
    const { items, total } = await listCmsContent({
      contentType: "news",
      page,
      limit: PAGE_SIZE,
    });
    const articles = items.map(cmsContentToNews);
    const hasMore = page * PAGE_SIZE < total;
    return NextResponse.json(
      { items: articles, hasMore },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("News latest-feed API failure", error);
    return NextResponse.json({ items: [], hasMore: false }, { status: 500 });
  }
}
