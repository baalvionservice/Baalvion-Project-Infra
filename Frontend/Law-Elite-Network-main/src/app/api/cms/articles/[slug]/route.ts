import { NextRequest, NextResponse } from 'next/server';
import { cmsGetArticleBySlug } from '@/lib/cms';

/**
 * Same-origin BFF for a single CMS-managed article by slug. Used as a fallback
 * on the article detail page when law-service does not have the slug.
 */
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await cmsGetArticleBySlug(slug);
  if (!article) return NextResponse.json({ data: null }, { status: 404 });
  return NextResponse.json({ data: article });
}
