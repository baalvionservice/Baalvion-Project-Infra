import { NextResponse } from 'next/server';
import { CMS_PUBLIC_URL, CMS_SITE_SLUG } from '@/services/data/cms-public';

/** Proxies the article poll to cms-service server-side — same CORS reason as the
 *  sibling feedback/comments routes. GET returns null when the article has no poll. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const upstream = await fetch(`${CMS_PUBLIC_URL}/${CMS_SITE_SLUG}/content/${encodeURIComponent(slug)}/poll`, {
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!upstream?.ok) return NextResponse.json(null);
  const body = await upstream.json().catch(() => null);
  return NextResponse.json(body?.data ?? null);
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let payload: { optionIndex?: number; voterToken?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }
  if (typeof payload.optionIndex !== 'number' || payload.optionIndex < 0) {
    return NextResponse.json({ message: 'Invalid poll option.' }, { status: 400 });
  }
  if (!payload.voterToken || payload.voterToken.length < 8) {
    return NextResponse.json({ message: 'Missing voter token.' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${CMS_PUBLIC_URL}/${CMS_SITE_SLUG}/content/${encodeURIComponent(slug)}/poll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionIndex: payload.optionIndex, voterToken: payload.voterToken }),
      signal: AbortSignal.timeout(8000),
    });
    const body = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return NextResponse.json({ message: body?.error?.message || 'Could not record your vote.' }, { status: upstream.status });
    }
    return NextResponse.json(body?.data ?? null);
  } catch {
    return NextResponse.json({ message: 'Could not record your vote.' }, { status: 502 });
  }
}
