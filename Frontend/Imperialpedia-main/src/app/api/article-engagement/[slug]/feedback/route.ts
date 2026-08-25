import { NextResponse } from 'next/server';
import { CMS_PUBLIC_URL, CMS_SITE_SLUG } from '@/services/data/cms-public';

/**
 * Proxies the "was this helpful?" vote to cms-service server-side — cms-service's
 * CORS allow-list doesn't include this app's origin (see cms-public.ts's file-level
 * comment), so a client component can't call it directly.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const upstream = await fetch(`${CMS_PUBLIC_URL}/${CMS_SITE_SLUG}/content/${encodeURIComponent(slug)}/feedback`, {
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!upstream?.ok) return NextResponse.json({ helpful: 0, notHelpful: 0 });
  const body = await upstream.json().catch(() => null);
  return NextResponse.json(body?.data ?? { helpful: 0, notHelpful: 0 });
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let payload: { vote?: string; voterToken?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }
  if (payload.vote !== 'helpful' && payload.vote !== 'not_helpful') {
    return NextResponse.json({ message: 'Invalid vote.' }, { status: 400 });
  }
  if (!payload.voterToken || payload.voterToken.length < 8) {
    return NextResponse.json({ message: 'Missing voter token.' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${CMS_PUBLIC_URL}/${CMS_SITE_SLUG}/content/${encodeURIComponent(slug)}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vote: payload.vote, voterToken: payload.voterToken }),
      signal: AbortSignal.timeout(8000),
    });
    const body = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return NextResponse.json({ message: body?.error?.message || 'Could not record your vote.' }, { status: upstream.status });
    }
    return NextResponse.json(body?.data ?? { helpful: 0, notHelpful: 0 });
  } catch {
    return NextResponse.json({ message: 'Could not record your vote.' }, { status: 502 });
  }
}
