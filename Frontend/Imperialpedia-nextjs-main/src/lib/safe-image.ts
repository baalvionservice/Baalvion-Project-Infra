/**
 * @fileOverview Shared host allowlist for images passed to next/image.
 *
 * next.config.ts only registers imperialpedia.com and api.baalvion.com in
 * images.remotePatterns (no stock/placeholder/third-party hosts) — any other
 * host makes the /_next/image optimizer 400. CMS-seeded rows sometimes still
 * carry a placeholder URL (e.g. picsum.photos) from before that policy was
 * enforced; this guard keeps those from ever reaching next/image.
 */

const ALLOWED_IMAGE_HOSTS = new Set(["imperialpedia.com", "api.baalvion.com"]);

/** True if `url` is on an allowlisted host next/image is configured to optimize. */
export function isAllowedImageHost(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    return ALLOWED_IMAGE_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
}

/** Returns `url` if its host is allowlisted, otherwise `fallback`. */
export function safeImageUrl(url: string | null | undefined, fallback: string): string {
  return isAllowedImageHost(url) ? (url as string) : fallback;
}
