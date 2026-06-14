import { NextRequest, NextResponse } from 'next/server';
import { cmsGetArticles } from '@/lib/cms';

/**
 * Same-origin BFF for CMS-managed encyclopedia articles. The cms-service public
 * API only allows server-side reads, so client components fetch this route.
 * Optional `?letter=A` filters to a single A–Z bucket.
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const letter = req.nextUrl.searchParams.get('letter') || undefined;
  const articles = await cmsGetArticles(letter);
  return NextResponse.json({ data: articles });
}
