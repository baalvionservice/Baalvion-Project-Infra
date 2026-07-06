import { NextRequest, NextResponse } from 'next/server';
import { cmsGetAuthorBySlug } from '@/lib/cms';

/**
 * Same-origin BFF for a single CMS-managed author profile by slug. Lets the
 * client author page render contributors created in the admin console that are
 * not in the bundled baseline.
 */
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const author = await cmsGetAuthorBySlug(slug);
  if (!author) return NextResponse.json({ data: null }, { status: 404 });
  return NextResponse.json({ data: author });
}
