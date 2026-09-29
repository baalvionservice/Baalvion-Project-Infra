import { draftMode } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { cmsGetPreviewContent } from '@/lib/cms';

/**
 * Entry point for the admin CMS live-preview iframe.
 *
 * admin-platform requests a short-lived token from cms-service, then points this route's
 * iframe src here: /api/preview?slug=...&exp=...&token=.... We hand the token straight back
 * to cms-service to validate + fetch the (possibly draft) content in one call — this app
 * never holds CMS_PREVIEW_SECRET. On success, Next draft mode is enabled and the request is
 * redirected into the real article page, carrying the token forward so the article's own
 * data fetch also resolves the draft version.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const slug = searchParams.get('slug');
  const exp = searchParams.get('exp');
  const token = searchParams.get('token');

  if (!slug || !exp || !token) {
    return NextResponse.json({ error: 'Missing preview parameters' }, { status: 400 });
  }

  const content = await cmsGetPreviewContent(slug, exp, token);
  if (!content) {
    return NextResponse.json({ error: 'Invalid or expired preview token' }, { status: 403 });
  }

  (await draftMode()).enable();

  const redirectUrl = req.nextUrl.clone();
  redirectUrl.pathname = `/article/${slug}`;
  redirectUrl.search = `?previewToken=${encodeURIComponent(token)}&previewExp=${encodeURIComponent(exp)}`;
  return NextResponse.redirect(redirectUrl);
}
