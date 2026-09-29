import { NextRequest, NextResponse } from 'next/server';
import { cmsGetArticles } from '@/lib/cms';

/**
 * Same-origin BFF for CMS-managed encyclopedia articles. The cms-service public
 * API only allows server-side reads, so client components fetch this route.
 * Optional `?letter=A` filters to a single A–Z bucket, `?category=slug` filters
 * to a taxonomy category (used for real related-article interlinking).
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const letter = req.nextUrl.searchParams.get('letter') || undefined;
  const category = req.nextUrl.searchParams.get('category') || undefined;
  const articles = await cmsGetArticles(letter, category);
  return NextResponse.json({ data: articles });
}
