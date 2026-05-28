/**
 * Edge-compatible in-memory rate limiter for Next.js API routes and middleware.
 * For production, replace the store with a Redis-backed implementation.
 */

interface RateRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateRecord>();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  identifier: string,
  opts: RateLimitOptions,
): RateLimitResult {
  const { windowMs, max, keyPrefix = 'rl' } = opts;
  const key = `${keyPrefix}:${identifier}`;
  const now = Date.now();

  let record = store.get(key);
  if (!record || now > record.resetAt) {
    record = { count: 0, resetAt: now + windowMs };
    store.set(key, record);
  }

  record.count += 1;

  if (store.size > 10_000) {
    for (const [k, v] of store.entries()) {
      if (now > v.resetAt) store.delete(k);
    }
  }

  return {
    allowed: record.count <= max,
    remaining: Math.max(0, max - record.count),
    resetAt: record.resetAt,
  };
}

export const AUTH_RATE_LIMIT: RateLimitOptions = {
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: 'auth',
};

export const API_RATE_LIMIT: RateLimitOptions = {
  windowMs: 60 * 1000,
  max: 100,
  keyPrefix: 'api',
};
