'use strict';

/**
 * Distributed, multi-instance rate limiter.
 *
 * The platform's existing `@baalvion/security` limiter is an in-memory,
 * single-process limiter (fine for Next.js edge routes). At 10k+ TPS across
 * many service replicas you need a SHARED counter so the limit is global, not
 * per-pod. This limiter keeps the count in Redis (atomic fixed-window via Lua)
 * and falls back to an in-memory store when no Redis client is supplied, so it
 * is safe to construct in tests and local dev.
 */

/** Atomic fixed-window counter: INCR, set expiry on first hit, return [count, pttl]. */
const FIXED_WINDOW_LUA = `
local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return {c, redis.call('PTTL', KEYS[1])}
`;

/** In-process fixed-window store (default / fallback). */
class MemoryStore {
  constructor() {
    this._m = new Map();
  }
  async incr(key, windowMs, now) {
    let rec = this._m.get(key);
    if (!rec || now >= rec.resetAt) {
      rec = { count: 0, resetAt: now + windowMs };
      this._m.set(key, rec);
    }
    rec.count++;
    if (this._m.size > 50_000) this._sweep(now);
    return { count: rec.count, resetAt: rec.resetAt };
  }
  _sweep(now) {
    for (const [k, v] of this._m.entries()) if (now >= v.resetAt) this._m.delete(k);
  }
}

/** Redis-backed store. `redis` is any ioredis-compatible client exposing `eval`. */
class RedisStore {
  constructor(redis) {
    this._redis = redis;
  }
  async incr(key, windowMs, now) {
    const [count, pttl] = await this._redis.eval(FIXED_WINDOW_LUA, 1, key, windowMs);
    return { count: Number(count), resetAt: now + Number(pttl) };
  }
}

class RateLimiter {
  /**
   * @param {object} [opts]
   * @param {number} [opts.windowMs] window length (default 60000)
   * @param {number} [opts.max] max requests per window per key (default 100)
   * @param {string} [opts.keyPrefix]
   * @param {{incr: Function}} [opts.store] custom store
   * @param {object} [opts.redis] ioredis-compatible client → uses RedisStore
   * @param {() => number} [opts.now] injectable clock
   */
  constructor(opts = {}) {
    this.windowMs = opts.windowMs ?? 60_000;
    this.max = opts.max ?? 100;
    this.keyPrefix = opts.keyPrefix ?? 'rl';
    this._now = opts.now || (() => Date.now());
    this.store = opts.store || (opts.redis ? new RedisStore(opts.redis) : new MemoryStore());
  }

  /**
   * Consume one unit for `id`.
   * @returns {Promise<{allowed: boolean, remaining: number, resetAt: number, retryAfterMs: number}>}
   */
  async consume(id) {
    const key = `${this.keyPrefix}:${id}`;
    const now = this._now();
    const { count, resetAt } = await this.store.incr(key, this.windowMs, now);
    const allowed = count <= this.max;
    return {
      allowed,
      remaining: Math.max(0, this.max - count),
      resetAt,
      retryAfterMs: allowed ? 0 : Math.max(0, resetAt - now),
    };
  }

  /**
   * Express middleware. Sets standard RateLimit-* headers and rejects with 429
   * (and a Retry-After header) when the shared window is exhausted.
   * @param {object} [opts]
   * @param {(req: any) => string} [opts.keyGenerator] defaults to org → user → ip
   */
  middleware(opts = {}) {
    const keyOf =
      opts.keyGenerator ||
      ((req) => req.auth?.orgId || req.auth?.subject || req.ip || 'anonymous');
    return async (req, res, next) => {
      try {
        const r = await this.consume(keyOf(req));
        res.setHeader('RateLimit-Limit', String(this.max));
        res.setHeader('RateLimit-Remaining', String(r.remaining));
        res.setHeader('RateLimit-Reset', String(Math.ceil(r.resetAt / 1000)));
        if (!r.allowed) {
          res.setHeader('Retry-After', String(Math.ceil(r.retryAfterMs / 1000)));
          res.status(429).json({
            error: { code: 'RATE_LIMITED', message: 'Too many requests. Please slow down.' },
          });
          return;
        }
        next();
      } catch (err) {
        // Fail-open: a limiter outage must not take down the API.
        next();
      }
    };
  }
}

module.exports = { RateLimiter, MemoryStore, RedisStore, FIXED_WINDOW_LUA };
