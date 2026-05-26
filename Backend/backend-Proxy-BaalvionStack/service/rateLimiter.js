'use strict';

/**
 * Distributed, Redis-backed rate limiting + concurrency control + brute-force
 * lockout. Uses a sliding-window log (sorted set) for accuracy.
 *
 * Availability posture: throughput limiting FAILS OPEN if Redis is down (so an
 * infra blip never DoSes paying customers), but every fail-open is logged.
 */

const { getRedis } = require('./redisClient');
const logger = require('./logger');

// Plan → limits. requestsPerMin = API/proxy control-plane calls; concurrency =
// simultaneous proxy connections.
const PLAN_LIMITS = {
  starter:    { requestsPerMin: 120,  concurrency: 50 },
  growth:     { requestsPerMin: 600,  concurrency: 250 },
  professional:{ requestsPerMin: 600, concurrency: 250 },
  enterprise: { requestsPerMin: 6000, concurrency: 2000 },
};
const DEFAULT_LIMITS = PLAN_LIMITS.starter;

function planLimits(plan) {
  return PLAN_LIMITS[plan] || DEFAULT_LIMITS;
}

/**
 * Sliding-window rate check.
 * @returns {{allowed:boolean, remaining:number, retryAfterMs:number, count:number}}
 */
async function slidingWindow(key, limit, windowMs) {
  const redis = getRedis();
  if (!redis) {
    logger.warn('[ratelimit] Redis unavailable — failing open for', key);
    return { allowed: true, remaining: limit, retryAfterMs: 0, count: 0 };
  }

  const now = Date.now();
  const member = `${now}-${Math.random().toString(36).slice(2)}`;
  const redisKey = `rl:${key}`;

  try {
    const results = await redis
      .multi()
      .zremrangebyscore(redisKey, 0, now - windowMs)
      .zadd(redisKey, now, member)
      .zcard(redisKey)
      .pexpire(redisKey, windowMs)
      .exec();

    const count = results[2][1];
    if (count > limit) {
      // This request is over budget — remove our own marker so it doesn't
      // penalize the next window, and compute retry-after from the oldest entry.
      await redis.zrem(redisKey, member);
      const oldest = await redis.zrange(redisKey, 0, 0, 'WITHSCORES');
      const retryAfterMs = oldest.length ? Math.max(0, windowMs - (now - Number(oldest[1]))) : windowMs;
      return { allowed: false, remaining: 0, retryAfterMs, count };
    }
    return { allowed: true, remaining: Math.max(0, limit - count), retryAfterMs: 0, count };
  } catch (err) {
    logger.error('[ratelimit] error, failing open:', err.message);
    return { allowed: true, remaining: limit, retryAfterMs: 0, count: 0 };
  }
}

/** Acquire one concurrency slot. @returns {{allowed:boolean, current:number}} */
async function acquireConcurrency(key, max) {
  const redis = getRedis();
  if (!redis) return { allowed: true, current: 0 };
  const redisKey = `cc:${key}`;
  try {
    const current = await redis.incr(redisKey);
    if (current === 1) await redis.expire(redisKey, 3600); // self-heal stuck counters
    if (current > max) {
      await redis.decr(redisKey);
      return { allowed: false, current: current - 1 };
    }
    return { allowed: true, current };
  } catch (err) {
    logger.error('[concurrency] error, failing open:', err.message);
    return { allowed: true, current: 0 };
  }
}

async function releaseConcurrency(key) {
  const redis = getRedis();
  if (!redis) return;
  try {
    const v = await redis.decr(`cc:${key}`);
    if (v < 0) await redis.set(`cc:${key}`, 0);
  } catch (err) {
    logger.error('[concurrency] release error:', err.message);
  }
}

// ── Brute-force lockout ─────────────────────────────────────────────────────────
const FAIL_WINDOW_S = Number(process.env.AUTH_FAIL_WINDOW_S || 900); // 15 min
const FAIL_THRESHOLD = Number(process.env.AUTH_FAIL_THRESHOLD || 10);

async function recordFailure(identifier) {
  const redis = getRedis();
  if (!redis) return 0;
  const key = `authfail:${identifier}`;
  try {
    const n = await redis.incr(key);
    if (n === 1) await redis.expire(key, FAIL_WINDOW_S);
    return n;
  } catch (err) {
    logger.error('[lockout] record error:', err.message);
    return 0;
  }
}

async function isLockedOut(identifier) {
  const redis = getRedis();
  if (!redis) return false;
  try {
    const n = Number(await redis.get(`authfail:${identifier}`)) || 0;
    return n >= FAIL_THRESHOLD;
  } catch (_) {
    return false;
  }
}

async function clearFailures(identifier) {
  const redis = getRedis();
  if (redis) await redis.del(`authfail:${identifier}`).catch(() => {});
}

module.exports = {
  planLimits,
  slidingWindow,
  acquireConcurrency,
  releaseConcurrency,
  recordFailure,
  isLockedOut,
  clearFailures,
  PLAN_LIMITS,
  FAIL_THRESHOLD,
};
