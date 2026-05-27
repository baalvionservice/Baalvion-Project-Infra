'use strict';
/**
 * Canonical shared JTI revocation (Phase 9).
 *
 * The blacklist key namespace is owned HERE so every canonical service uses the IDENTICAL
 * scheme — no per-service key formats, no in-memory fallback, no isolated stores.
 *
 *   key:  auth:blacklist:<jti>      (value '1')
 *   TTL:  the token's remaining lifetime (exp - now), so the entry self-expires with the token.
 *
 * auth-node stays dependency-free: the Redis client is INJECTED by the service. It must expose
 * ioredis-style async `get(key)` and `set(key, val, 'EX', seconds)`. A Redis outage makes
 * verification fail CLOSED (see createJwksVerifier.assertValid) — a revoked token must never slip
 * through because the store is down.
 */

const BLACKLIST_PREFIX = 'auth:blacklist:';
const blacklistKey = (jti) => `${BLACKLIST_PREFIX}${jti}`;

/** Remaining seconds until `exp` (the token-expiry delta), floored at 1; 900 if no exp. */
function ttlFromExp(exp, now = Math.floor(Date.now() / 1000)) {
  if (!exp || typeof exp !== 'number') return 900;
  return Math.max(1, Math.floor(exp - now));
}

/**
 * Returns an async `isBlacklisted(jti)` bound to the canonical key + the injected Redis client.
 * Plug into createJwksVerifier/createAuthMiddleware via the `redis` option (auto-wired) or
 * `isBlacklisted` directly.
 */
function createRedisBlacklist(redis, { logger = console } = {}) {
  if (!redis || typeof redis.get !== 'function') {
    throw new Error('[auth-node] createRedisBlacklist requires a redis client exposing async get()');
  }
  return async function isBlacklisted(jti) {
    if (!jti) return false;
    const v = await redis.get(blacklistKey(jti)); // throws on outage -> verifier fails CLOSED
    return v != null;
  };
}

/**
 * Revoke a token by jti. `ttlSeconds` should be the token's remaining lifetime
 * (use `ttlFromExp(claims.exp)`); the entry then expires exactly when the token would.
 */
async function revokeJti(redis, jti, ttlSeconds = 900) {
  if (!redis || typeof redis.set !== 'function') {
    throw new Error('[auth-node] revokeJti requires a redis client exposing async set()');
  }
  if (!jti) throw new Error('[auth-node] revokeJti requires a jti');
  const ttl = Math.max(1, Math.floor(ttlSeconds));
  return redis.set(blacklistKey(jti), '1', 'EX', ttl);
}

module.exports = { BLACKLIST_PREFIX, blacklistKey, ttlFromExp, createRedisBlacklist, revokeJti };
