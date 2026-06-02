import type { SdkCache } from './types';

/**
 * Default in-process cache for the config-resolver. Fine for a single instance;
 * for multi-instance coherence pass a Redis-backed SdkCache (wrap @baalvion/cache).
 */
export function createMemoryCache(): SdkCache {
  const store = new Map<string, { value: string; expiresAt: number }>();
  return {
    async get(key) {
      const e = store.get(key);
      if (!e) return null;
      if (Date.now() > e.expiresAt) { store.delete(key); return null; }
      return e.value;
    },
    async set(key, value, ttlSeconds) {
      store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    },
    async del(key, prefix) {
      if (!prefix) { store.delete(key); return; }
      for (const k of store.keys()) if (k.startsWith(key)) store.delete(k);
    },
  };
}
