/**
 * @fileOverview Dependency-free, in-memory sliding-window rate limiter.
 *
 * Tracks request timestamps per key (typically "<endpoint>:<ip>") and allows up
 * to `limit` requests within a rolling `windowMs` window.
 *
 * TODO: This limiter lives in a single process's memory. For multi-instance /
 * serverless production deployments it must be replaced with a shared store
 * (e.g. Redis with a sliding-window or token-bucket Lua script), otherwise each
 * instance enforces its own independent quota and the effective limit scales
 * with the instance count.
 */

interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  retryAfterMs: number;
}

// key -> sorted list of request timestamps (ms) within the current window.
const hits = new Map<string, number[]>();

// Periodically prune empty/stale buckets so the Map does not grow unbounded.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function pruneStale(now: number, windowMs: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, timestamps] of hits) {
    const fresh = timestamps.filter((t) => now - t < windowMs);
    if (fresh.length === 0) {
      hits.delete(key);
    } else {
      hits.set(key, fresh);
    }
  }
}

/**
 * Records a request against `key` and reports whether it is allowed.
 *
 * @returns success=false with retryAfterMs (>0) when the limit is exceeded.
 */
export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const { limit, windowMs } = opts;
  const now = Date.now();

  pruneStale(now, windowMs);

  const windowStart = now - windowMs;
  const existing = hits.get(key) ?? [];
  // Keep only timestamps still inside the rolling window.
  const recent = existing.filter((t) => t > windowStart);

  if (recent.length >= limit) {
    const oldest = recent[0];
    const retryAfterMs = Math.max(0, oldest + windowMs - now);
    // Do not record the rejected attempt — store the trimmed window back.
    hits.set(key, recent);
    return { success: false, remaining: 0, retryAfterMs };
  }

  recent.push(now);
  hits.set(key, recent);

  return {
    success: true,
    remaining: Math.max(0, limit - recent.length),
    retryAfterMs: 0,
  };
}
