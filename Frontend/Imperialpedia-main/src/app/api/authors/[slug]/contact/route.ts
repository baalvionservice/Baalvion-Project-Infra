import { NextResponse } from 'next/server';
import { CMS_PUBLIC_URL, CMS_SITE_SLUG } from '@/services/data/cms-public';

/** Proxies the "Contact the Author" form to cms-service server-side — same CORS
 *  reason as the sibling comments/feedback routes (cms-service's allow-list
 *  doesn't include this app's origin). */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let payload: { authorName?: string; name?: string; email?: string; message?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid request body.' }, { status: 400 });
  }
  const { authorName, name, email, message } = payload;
  if (!authorName?.trim() || !name?.trim() || !email?.trim() || !message?.trim()) {
    return NextResponse.json({ message: 'Name, email, and a message are required.' }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${CMS_PUBLIC_URL}/${CMS_SITE_SLUG}/authors/${encodeURIComponent(slug)}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authorName, name, email, message }),
      signal: AbortSignal.timeout(8000),
    });
    const body = await upstream.json().catch(() => null);
    if (!upstream.ok) {
      return NextResponse.json(
        { message: body?.error?.message || 'Could not send your message.' },
        { status: upstream.status },
      );
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Could not send your message.' }, { status: 502 });
  }
}
