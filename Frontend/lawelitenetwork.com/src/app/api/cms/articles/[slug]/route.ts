import { NextRequest, NextResponse } from 'next/server';
import { cmsGetArticleBySlug, cmsGetPreviewContent } from '@/lib/cms';

/**
 * Same-origin BFF for a single CMS-managed article by slug. Used as a fallback
 * on the article detail page when law-service does not have the slug.
 *
 * When called with `previewToken`/`previewExp` (forwarded by the article page while the
 * admin CMS live-preview iframe is open), fetches the draft/unpublished version via
 * cms-service's token-gated preview endpoint instead of the published-only one.
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const previewToken = req.nextUrl.searchParams.get('previewToken');
  const previewExp = req.nextUrl.searchParams.get('previewExp');

  const article = previewToken && previewExp
    ? await cmsGetPreviewContent(slug, previewExp, previewToken)
    : await cmsGetArticleBySlug(slug);

  if (!article) return NextResponse.json({ data: null }, { status: 404 });
  return NextResponse.json({ data: article });
}
