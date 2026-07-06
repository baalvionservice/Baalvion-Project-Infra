import { NextResponse } from 'next/server';
import { cmsGetNewsPage } from '@/lib/cms';

const PAGE_SIZE = 12;

/**
 * Same-origin pagination proxy for the /news infinite-scroll feed. Keeps the
 * cms-service call server-side (CMS_PUBLIC_URL is a server-only env var here,
 * unlike Imperialpedia's NEXT_PUBLIC_-prefixed equivalent) and avoids
 * cross-origin fetches from the browser.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  try {
    const { items, hasMore } = await cmsGetNewsPage(page, PAGE_SIZE);
    return NextResponse.json(
      { items, hasMore },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    );
  } catch {
    return NextResponse.json({ items: [], hasMore: false }, { status: 500 });
  }
}
