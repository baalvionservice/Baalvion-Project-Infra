import { NextRequest, NextResponse } from 'next/server';
import { cmsGetFeedback, cmsSubmitFeedback } from '@/lib/cms';

/**
 * Same-origin BFF for "was this helpful?" voting on a CMS-managed article.
 * GET returns the live vote counts; POST casts a vote (de-duped server-side
 * by voterToken, see cmsSubmitFeedback) and returns the updated counts.
 */
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const summary = await cmsGetFeedback(slug);
  return NextResponse.json({ data: summary });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  if (!body || (body.vote !== 'helpful' && body.vote !== 'not_helpful') || typeof body.voterToken !== 'string') {
    return NextResponse.json({ data: null, error: 'Invalid request' }, { status: 400 });
  }
  const summary = await cmsSubmitFeedback(slug, { vote: body.vote, voterToken: body.voterToken });
  if (!summary) return NextResponse.json({ data: null, error: 'Could not submit feedback' }, { status: 502 });
  return NextResponse.json({ data: summary });
}
