/**
 * Live-presence beacon — tells commerce-service that one anonymous shopper is on the storefront
 * right now. The backend keeps a short-TTL per-store set of recent heartbeats; the admin dashboard
 * reads the resulting "live visitors" count. This client is fire-and-forget and fail-silent: a
 * presence ping must never affect the shopper's experience.
 *
 * Uses the SAME public storefront base as catalog.ts (NEXT_PUBLIC_COMMERCE_URL, no auth) and the
 * same store-id resolution, so it targets `/commerce/storefront/:storeId/presence/heartbeat`.
 */
import { resolveConfiguredStoreId } from './store-id';

const COMMERCE_URL = process.env.NEXT_PUBLIC_COMMERCE_URL || 'http://localhost:3012/api/v1';

// One opaque id per browser tab/session — NOT a user id. sessionStorage scopes it to the tab so a
// single open tab counts as exactly one live visitor, and it disappears when the tab closes.
const VISITOR_KEY = 'amarise.visitorId';

function randomId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to the Math.random fallback */
  }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Stable per-tab visitor id (created lazily, persisted in sessionStorage). */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = window.sessionStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id = randomId();
    window.sessionStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    // sessionStorage unavailable (privacy mode) — a per-call id still registers a live visitor,
    // it just won't dedupe across this tab's pings. Better than not counting at all.
    return randomId();
  }
}

/**
 * Send a single presence heartbeat. Resolves to the current live count, or null when the ping
 * could not be sent (no store configured, network error, server down). Never throws.
 */
export async function sendHeartbeat(): Promise<number | null> {
  if (typeof window === 'undefined') return null;
  const storeId = resolveConfiguredStoreId();
  if (!storeId) return null;
  const visitorId = getVisitorId();
  if (!visitorId) return null;

  try {
    const res = await fetch(`${COMMERCE_URL}/commerce/storefront/${storeId}/presence/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId }),
      // keepalive lets a final beat survive a tab close / navigation.
      keepalive: true,
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { count?: number } };
    const count = json?.data?.count;
    return typeof count === 'number' ? count : null;
  } catch {
    return null;
  }
}
