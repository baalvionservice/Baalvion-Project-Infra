import { NextResponse } from 'next/server';
import sharp from 'sharp';

/**
 * Serves person photos held in law-service from LEN's own origin, so the
 * image URL is on lawelitenetwork.com (what image search and social cards
 * should see) and the browser never talks to the API directly.
 *
 * `?w=` picks one of a few fixed widths to keep the cache small and stop the
 * route being used as an open resizer.
 */
export const runtime = 'nodejs';

const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3015/v1');
const WIDTHS = new Set([240, 480, 800, 1000]);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,9}$/.test(id) || !/^https?:\/\//i.test(BASE_URL)) return new NextResponse('Not found', { status: 404 });

  const upstream = await fetch(`${BASE_URL}/people/photos/${id}`, { next: { revalidate: 86400 } }).catch(() => null);
  if (!upstream || !upstream.ok) return new NextResponse('Not found', { status: 404 });

  const w = Number(new URL(req.url).searchParams.get('w'));
  let body: Buffer = Buffer.from(await upstream.arrayBuffer());
  let type = upstream.headers.get('content-type') || 'image/jpeg';

  if (WIDTHS.has(w)) {
    // failOn: 'none' tolerates slightly malformed files that browsers still render; if resizing fails
    // anyway the original is served, so a card never shows a broken image.
    try {
      body = await sharp(body, { failOn: 'none' }).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
      type = 'image/webp';
    } catch {
      /* serve the original bytes */
    }
  }

  return new NextResponse(new Uint8Array(body), {
    headers: {
      'Content-Type': type,
      // A photo id never changes content (a replacement is a new id).
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
