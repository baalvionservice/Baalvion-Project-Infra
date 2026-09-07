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

/**
 * SESSION-level revocation.
 *
 *   key:  auth:session_revoked:<sid>   (value '1')
 *
 * Why this exists alongside the per-jti list. Revoking a token by jti requires knowing the
 * jti, and the issuer does not keep a record of every access token it has minted — so events
 * that must end a whole SESSION (a password reset, an account takeover) had nothing to write.
 * Database session revocation stops the next REFRESH, which leaves the already-issued access
 * token working until it expires: a real, if bounded, window.
 *
 * The `sid` claim is required on every canonical token and identifies the session row, so it
 * is the natural key. Marking a sid here rejects every token bound to that session — at the
 * gateway and at every downstream service — because both verify through this package.
 *
 * This is the same mechanism as the jti list, at a coarser grain. It is not a second
 * authentication system: same store, same namespace, same fail-closed behaviour.
 */
const SESSION_REVOKED_PREFIX = 'auth:session_revoked:';
const sessionRevokedKey = (sid) => `${SESSION_REVOKED_PREFIX}${sid}`;

/**
 * How long a session-revocation marker must outlive the tokens it invalidates.
 *
 * Only tokens issued BEFORE the revocation matter, and an access token is short-lived, so the
 * marker only has to survive longer than the longest access token that could still be in
 * flight. An hour is comfortably beyond the 15-minute access lifetime plus any clock skew,
 * and the key expires on its own afterwards rather than accumulating forever.
 */
const SESSION_REVOCATION_TTL = 3600;

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

/**
 * Returns an async `isSessionRevoked(sid)` bound to the canonical key + injected Redis client.
 * Wired automatically by createJwksVerifier/createAuthMiddleware via the `redis` option.
 */
function createRedisSessionRevocation(redis, { logger = console } = {}) {
    if (!redis || typeof redis.get !== 'function') {
        throw new Error('[auth-node] createRedisSessionRevocation requires a redis client exposing async get()');
    }
    return async function isSessionRevoked(sid) {
        if (!sid) return false;
        const v = await redis.get(sessionRevokedKey(sid)); // throws on outage -> verifier fails CLOSED
        return v != null;
    };
}

/**
 * End a session everywhere, immediately.
 *
 * Call this wherever the DATABASE session is revoked — the two belong together: the database
 * row stops the next refresh, and this stops the access token already in the browser.
 */
async function revokeSession(redis, sid, ttlSeconds = SESSION_REVOCATION_TTL) {
    if (!redis || typeof redis.set !== 'function') {
        throw new Error('[auth-node] revokeSession requires a redis client exposing async set()');
    }
    if (!sid) throw new Error('[auth-node] revokeSession requires a sid');
    return redis.set(sessionRevokedKey(sid), '1', 'EX', Math.max(1, Math.floor(ttlSeconds)));
}

module.exports = {
    BLACKLIST_PREFIX, blacklistKey, ttlFromExp, createRedisBlacklist, revokeJti,
    SESSION_REVOKED_PREFIX, SESSION_REVOCATION_TTL, sessionRevokedKey,
    createRedisSessionRevocation, revokeSession,
};
