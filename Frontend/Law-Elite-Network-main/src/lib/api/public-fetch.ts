/**
 * Cached, server-only reads against law-service's public API (articles,
 * categories) for use in Server Components. Replaces the per-request axios
 * calls that used to run on every homepage/category-page hit — Googlebot and
 * visitors now get a fast cached response instead of a live round-trip each
 * time, matching the caching strategy already used for CMS reads (@/lib/cms).
 */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3015/v1');

// Hard cap so a slow/hung law-service response falls back to the caller's
// bundled/CMS content instead of hanging the page render.
const FETCH_TIMEOUT_MS = 4000;

/**
 * Fails closed to `null` on any problem (no base URL configured, timeout,
 * network error, or non-2xx response) so callers can fall back to bundled/CMS
 * content -- the same contract the axios `.catch()` calls this replaces
 * already relied on.
 */
export async function fetchPublicApi(
  path: string,
  params?: Record<string, string | number>,
): Promise<any | null> {
  if (!/^https?:\/\//i.test(BASE_URL)) return null;
  const qs = params
    ? `?${new URLSearchParams(
        Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
      ).toString()}`
    : '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const r = await fetch(`${BASE_URL}${path}${qs}`, {
      next: { revalidate: 300 },
      signal: controller.signal,
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
