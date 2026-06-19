/**
 * Pure, server-safe image helpers (no client-only runtime), so they can be called
 * from Server Components. <BrandImage> re-exports `isRealImage` for client consumers.
 *
 * When `src` is a REAL uploaded photo it should render edge-to-edge; when it is
 * missing or still a dev placeholder (picsum / placehold.co) the UI shows an elegant
 * branded panel instead of a random stock photo.
 */
const PLACEHOLDER_HOSTS = ['picsum.photos', 'placehold.co', 'placekitten', 'via.placeholder'];

export function isRealImage(src?: string | null): boolean {
  if (!src || typeof src !== 'string') return false;
  const s = src.trim();
  if (!s) return false;
  return !PLACEHOLDER_HOSTS.some((h) => s.includes(h));
}
