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

// This route re-fetches + re-runs sharp on EVERY request, even though the
// output for a given (url, width, quality) is always identical. The homepage
// alone renders 50+ article thumbnails through here, many repeating the same
// underlying image across sections (Essential Reads, category grids, related
// articles) -- with no server-side cache, every single one of those pays the
// full upstream-fetch-plus-resize cost independently, so under real page-load
// concurrency requests queue up (observed climbing past 2s), and lazy-loaded
// <img>s below the fold lose the race against a normal scroll, rendering as
// blank placeholder boxes long enough to look broken even though every image
// does eventually load. Caching the resized bytes here (this is a persistent
// Node server per next.config.ts's `output: 'standalone'`, not a per-request
// serverless function, so the cache actually survives across requests) turns
// every repeat/concurrent hit for the same image into an instant in-memory
// return instead of a fresh network + sharp round trip.
const RESIZED_CACHE_MAX_ENTRIES = 500;
const resizedCache = new Map<string, { body: Buffer; contentType: string }>();
const inFlight = new Map<string, Promise<{ body: Buffer; contentType: string } | null>>();

function cacheSet(key: string, value: { body: Buffer; contentType: string }): void {
  if (resizedCache.size >= RESIZED_CACHE_MAX_ENTRIES) {
    const oldestKey = resizedCache.keys().next().value;
    if (oldestKey !== undefined) resizedCache.delete(oldestKey);
  }
  resizedCache.set(key, value);
}

function isDisallowedTarget(url: URL): boolean {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return true;
  // The site's own configured origin is always trusted (it's in ALLOWED_HOSTS
  // below) even when that origin IS a private/localhost address -- which it
  // legitimately is in local/docker dev (NEXT_PUBLIC_APP_URL=http://localhost:*,
  // see docker-compose.yml). Without this, resolveArticleImage()'s bundled
  // article-art URLs (built from the same env var, in src/lib/article-art.ts)
  // self-reference localhost and get rejected as a fake SSRF attempt, breaking
  // every bundled hero image in that environment. Doesn't weaken the guard for
  // attacker-supplied `url` params: reaching this server's own already-public
  // port grants no access an attacker didn't already have.
  if (url.hostname === siteHostname()) return false;
  return PRIVATE_HOSTNAME_RE.test(url.hostname);
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

  const cacheKey = `${target.toString()}::${width}::${quality}`;
  const cached = resizedCache.get(cacheKey);
  if (cached) {
    return new NextResponse(new Uint8Array(cached.body), {
      headers: { ...imageHeaders(cached.contentType), 'X-Image-Cache': 'HIT' },
    });
  }

  // Concurrent requests for the same (url, width, quality) -- routine here,
  // since the same thumbnail commonly appears in several homepage sections at
  // once -- share one upstream fetch + resize instead of each doing it again.
  let pending = inFlight.get(cacheKey);
  if (!pending) {
    pending = fetchAndResize(target, width, quality);
    inFlight.set(cacheKey, pending);
    pending.finally(() => inFlight.delete(cacheKey));
  }

  const result = await pending;
  if (!result) {
    return new NextResponse('Upstream fetch failed', { status: 502 });
  }
  cacheSet(cacheKey, result);
  return new NextResponse(new Uint8Array(result.body), {
    headers: { ...imageHeaders(result.contentType), 'X-Image-Cache': 'MISS' },
  });
}

// Same-origin SVG (the only SVG source that ever reaches this route — see the
// comment in fetchAndResize) still needs the restrictive CSP the old built-in
// optimizer applied, so an <img>-embedded SVG can't execute script; the cache
// only stores bytes + content-type, so both the cache-hit and cache-miss
// response sites need this applied uniformly rather than just the original
// single inline response.
function imageHeaders(contentType: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
  };
  if (contentType === 'image/svg+xml') {
    headers['Content-Security-Policy'] = "default-src 'self'; script-src 'none'; sandbox;";
  }
  return headers;
}

async function fetchAndResize(
  target: URL,
  width: number,
  quality: number,
): Promise<{ body: Buffer; contentType: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), { signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
  if (!upstream.ok) return null;

  const contentType = upstream.headers.get('content-type') || '';
  const bytes = Buffer.from(await upstream.arrayBuffer());

  // Our own @baalvion/illustrations artwork is the only SVG source reachable
  // here (see next.config.ts's prior dangerouslyAllowSVG comment) — pass it
  // through unrasterized, with the same restrictive CSP the old built-in
  // optimizer applied so an <img>-embedded SVG still can't execute script.
  if (contentType.includes('svg')) {
    return { body: bytes, contentType: 'image/svg+xml' };
  }
  if (!contentType.startsWith('image/')) return null;

  try {
    const resized = await sharp(bytes)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
    return { body: resized, contentType: 'image/webp' };
  } catch {
    // Corrupt/unsupported source (e.g. an animated GIF sharp can't touch) —
    // cache and serve the original rather than a broken image.
    return { body: bytes, contentType };
  }
}
