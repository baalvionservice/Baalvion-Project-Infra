// A cache for public reads made while rendering pages on the server. The hosting setup has no shared page cache, so
// without this every visitor made the API and database do the same work again. Two layers: this server instance's memory,
// and the edge cache shared by every instance in the same data centre. Simultaneous requests for one key wait for a single
// fetch, and if a refresh fails the previous value keeps being served. Never used in the browser, and never for anything
// that depends on who is signed in.
const store = new Map<string, { at: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

type EdgeCache = { match(r: Request): Promise<Response | undefined>; put(r: Request, res: Response): Promise<void> };
const edge = (): EdgeCache | null => {
  try { return (globalThis as unknown as { caches?: { default?: EdgeCache } }).caches?.default ?? null } catch { return null }
};
const edgeKey = (key: string) => new Request(`https://cache.hellroad.internal/${encodeURIComponent(key)}`);

export async function memo<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  if (typeof window !== "undefined") return load();
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const running = inflight.get(key);
  if (running) return running as Promise<T>;
  const p = (async () => {
    const shared = edge();
    if (shared) {
      try {
        const res = await shared.match(edgeKey(key));
        if (res) { const value = (await res.json()) as T; store.set(key, { at: Date.now(), value }); return value; }
      } catch { /* fall through to a real load */ }
    }
    const value = await load();
    store.set(key, { at: Date.now(), value });
    if (shared) {
      try { await shared.put(edgeKey(key), new Response(JSON.stringify(value), { headers: { "content-type": "application/json", "cache-control": `public, max-age=${Math.max(1, Math.floor(ttlMs / 1000))}` } })) } catch { /* too large or unavailable: memory only */ }
    }
    return value;
  })()
    .catch((err) => { if (hit) return hit.value as T; throw err; })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
