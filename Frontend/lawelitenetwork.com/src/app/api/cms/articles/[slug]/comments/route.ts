import { NextRequest, NextResponse } from 'next/server';
import { cmsGetComments, cmsSubmitComment } from '@/lib/cms';

/**
 * Same-origin BFF for reader comments on a CMS-managed article. GET returns
 * only already-approved comments; POST submits a new one, which the backend
 * holds as 'pending' until an editor moderates it (never published immediately).
 */
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const comments = await cmsGetComments(slug);
  return NextResponse.json({ data: comments });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body.authorName !== 'string' || typeof body.authorEmail !== 'string' || typeof body.body !== 'string') {
    return NextResponse.json({ data: null, error: 'Invalid request' }, { status: 400 });
  }
  const result = await cmsSubmitComment(slug, {
    authorName: body.authorName,
    authorEmail: body.authorEmail,
    body: body.body,
  });
  if (!result) return NextResponse.json({ data: null, error: 'Could not submit comment' }, { status: 502 });
  return NextResponse.json({ data: result }, { status: 201 });
}
