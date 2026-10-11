// A small in-memory cache for public reads made while rendering pages on the server. The hosting setup has no shared page
// cache, so without this every visitor made the API and database do the same work again. Entries are shared by everyone
// hitting the same server instance, simultaneous requests for the same key wait for one fetch, and if a refresh fails the
// previous value keeps being served. Never used in the browser, and never for anything that depends on who is signed in.
const store = new Map<string, { at: number; value: unknown }>();
const inflight = new Map<string, Promise<unknown>>();

export async function memo<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  if (typeof window !== "undefined") return load();
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.value as T;
  const running = inflight.get(key);
  if (running) return running as Promise<T>;
  const p = load()
    .then((value) => { store.set(key, { at: Date.now(), value }); return value; })
    .catch((err) => { if (hit) return hit.value as T; throw err; })
    .finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
