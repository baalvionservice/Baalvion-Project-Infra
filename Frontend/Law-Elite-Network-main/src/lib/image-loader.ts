/**
 * next/image custom loader (see next.config.ts images.loader/loaderFile).
 *
 * Vercel's built-in /_next/image optimizer 402s on this project's plan
 * (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED — see next.config.ts history),
 * which previously forced images.unoptimized:true and shipped every image at
 * source resolution/format. This routes through our own resize endpoint
 * (src/app/api/image/route.ts, sharp-based) instead — same resize/WebP
 * behavior, no per-image Vercel cost.
 *
 * data:/blob: URIs (the inline SVG art fallback in src/lib/article-art.ts)
 * never reach a loader — next/image renders those directly.
 */
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const params = new URLSearchParams({
    url: src,
    w: String(width),
    q: String(quality ?? 75),
  });
  return `/api/image?${params.toString()}`;
}
