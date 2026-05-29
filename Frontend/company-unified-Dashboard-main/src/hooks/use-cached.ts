"use client";
// Tiny client-side cache for read-only reference data: in-flight de-duplication + short TTL.
// Many components share the same hook (e.g. useDashboardRefs is used by 23 components); without
// this, each mount fires its own fetch (we measured /domains ×7 and /employees ×7 on one page).
// cachedGet collapses those into ONE network call and reuses the result across components + nav.

const store = new Map<string, { data: unknown; at: number }>();
const inflight = new Map<string, Promise<unknown>>();
const TTL_MS = 60_000; // reference data is fine to reuse for a minute

export async function cachedGet<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data as T;
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = (async () => {
    try {
      const data = await fetcher();
      store.set(key, { data, at: Date.now() });
      return data;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p as Promise<T>;
}

/** Drop a cached entry (or all) — e.g. after a mutation so the next read refetches. */
export function invalidateCache(key?: string): void {
  if (!key) { store.clear(); inflight.clear(); return; }
  store.delete(key);
  inflight.delete(key);
}
