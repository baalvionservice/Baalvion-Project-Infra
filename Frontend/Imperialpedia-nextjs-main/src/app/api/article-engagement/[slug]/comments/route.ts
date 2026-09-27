import { NextResponse } from 'next/server';
import { CMS_PUBLIC_URL, CMS_SITE_SLUG } from '@/services/data/cms-public';

/** Proxies reader comments to cms-service server-side — same CORS reason as the
 *  sibling feedback route. GET returns approved-only; POST lands as pending review. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const upstream = await fetch(`${CMS_PUBLIC_URL}/${CMS_SITE_SLUG}/content/${encodeURIComponent(slug)}/comments`, {
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!upstream?.ok) return NextResponse.json([]);
  const body = await upstream.json().catch(() => null);
  return NextResponse.json(body?.data ?? []);
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let payload: { authorName?: string; authorEmail?: string; body?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }
  const { authorName, authorEmail, body: commentBody } = payload;
  if (!authorName?.trim() || !authorEmail?.trim() || !commentBody?.trim()) {
    return NextResponse.json({ message: 'Name, email, and a comment are required.' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${CMS_PUBLIC_URL}/${CMS_SITE_SLUG}/content/${encodeURIComponent(slug)}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorName, authorEmail, body: commentBody }),
      signal: AbortSignal.timeout(8000),
    });
    const responseBody = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return NextResponse.json(
        { message: responseBody?.error?.message || 'Could not submit your comment.' },
        { status: upstream.status },
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Could not submit your comment.' }, { status: 502 });
  }
}
