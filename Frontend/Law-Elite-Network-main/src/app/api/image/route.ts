import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

/**
 * Same-origin image-resizing proxy backing next/image's custom loader (see
 * src/lib/image-loader.ts + next.config.ts images.loader). Replaces Vercel's
 * billed /_next/image optimizer with our own sharp pipeline so images ship
 * resized + WebP without per-image Vercel cost.
 *
 * sharp needs Node APIs, not the Edge runtime.
 */
export const runtime = 'nodejs';

const FETCH_TIMEOUT_MS = 8000;

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lawelitenetwork.com';
function siteHostname(): string {
  try {
    return new URL(SITE_URL).hostname;
  } catch {
    return '';
  }
}

// This endpoint fetches server-side — unlike the old images.unoptimized:true
// passthrough (the browser fetched remote images directly, so any https host
// was safe to allow), an open host list HERE would be a real SSRF vector
// (arbitrary internal/metadata URLs). A host that isn't on this list yet (new
// CMS media bucket, a contributor's avatar provider, an ad creative CDN)
// redirects straight to the original image below instead of being fetched, so
// it degrades to "not resized" rather than "broken" or "proxied blind." Add a
// host here once it's a confirmed, trusted image source — keep in sync with
// the hosts documented in next.config.ts's former remotePatterns.
const ALLOWED_HOSTS = new Set(
  [siteHostname(), 'api.baalvion.com', 'firebasestorage.googleapis.com', 'lh3.googleusercontent.com'].filter(
    Boolean,
  ),
);

// Must match next.config.ts images.deviceSizes + imageSizes exactly — next/image
// only ever requests one of these widths, so anything else is a forged request
// trying to force arbitrary/expensive resize work.
const ALLOWED_WIDTHS = new Set([16, 32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]);

const PRIVATE_HOSTNAME_RE =
  /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[0-1])\.|\[?::1\]?|0\.0\.0\.0)/i;

function isDisallowedTarget(url: URL): boolean {
  return (url.protocol !== 'https:' && url.protocol !== 'http:') || PRIVATE_HOSTNAME_RE.test(url.hostname);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawUrl = searchParams.get('url');
  const width = Number(searchParams.get('w'));
  const quality = Math.min(100, Math.max(1, Number(searchParams.get('q')) || 75));

  if (!rawUrl || !ALLOWED_WIDTHS.has(width)) {
    return new NextResponse('Bad request', { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(rawUrl);
  } catch {
    return new NextResponse('Bad request', { status: 400 });
  }

  if (isDisallowedTarget(target)) {
    return new NextResponse('Bad request', { status: 400 });
  }

  // Unknown/untrusted host: never proxy-fetch it server-side. Send the
  // browser straight to the original instead so the image still renders.
  if (!ALLOWED_HOSTS.has(target.hostname)) {
    return NextResponse.redirect(target.toString(), 307);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), { signal: controller.signal });
  } catch {
    return new NextResponse('Upstream fetch failed', { status: 502 });
  } finally {
    clearTimeout(timer);
  }
  if (!upstream.ok) {
    return new NextResponse('Upstream error', { status: 502 });
  }

  const contentType = upstream.headers.get('content-type') || '';
  const bytes = Buffer.from(await upstream.arrayBuffer());

  // Our own @baalvion/illustrations artwork is the only SVG source reachable
  // here (see next.config.ts's prior dangerouslyAllowSVG comment) — pass it
  // through unrasterized, with the same restrictive CSP the old built-in
  // optimizer applied so an <img>-embedded SVG still can't execute script.
  if (contentType.includes('svg')) {
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Security-Policy': "default-src 'self'; script-src 'none'; sandbox;",
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }
  if (!contentType.startsWith('image/')) {
    return new NextResponse('Not an image', { status: 415 });
  }

  try {
    const resized = await sharp(bytes)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    return new NextResponse(new Uint8Array(resized), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    // Corrupt/unsupported source (e.g. an animated GIF sharp can't touch) —
    // serve the original rather than a broken image.
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}
