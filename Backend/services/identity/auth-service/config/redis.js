'use strict';
const config = require('./appConfig');

let Redis;
let _client = null;
let _available = null; // null = unknown, true/false = resolved

function _tryLoadIoredis() {
    if (Redis !== undefined) return;
    try { Redis = require('ioredis'); } catch { Redis = null; }
}

function getClient() {
    _tryLoadIoredis();
    if (!Redis || !config.redis.host) return null;
    if (_client) return _client;

    _client = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password || undefined,
        db: config.redis.db,
        enableReadyCheck: true,
        maxRetriesPerRequest: 2,
        retryStrategy: (times) => {
            if (times > 3) return null; // stop retrying after 3 attempts
            return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
    });

    _client.on('error', (err) => {
        if (err.code !== 'ECONNREFUSED') console.warn('[Redis]', err.message);
    });
    _client.on('connect', () => {
        _available = true;
        console.log('[Redis] Connected');
    });
    _client.on('close', () => { _available = false; });

    return _client;
}

async function connect() {
    const r = getClient();
    if (!r) { _available = false; return; }
    try {
        await r.connect();
        _available = true;
    } catch (err) {
        _available = false;
        console.warn('[Redis] Unavailable — rate limiting and token blacklisting disabled:', err.message);
    }
}

function isAvailable() { return _available === true; }

// ── Key namespaces ─────────────────────────────────────────────────────────────
const K = {
    loginByIp:     (ip)       => `auth:login_ip:${ip}`,
    loginByEmail:  (email)    => `auth:login_em:${email}`,
    blacklist:     (jti)      => `auth:blacklist:${jti}`,  // Phase 9: canonical shared namespace (matches @baalvion/auth-node)
    familyRevoked: (familyId) => `auth:fam_rev:${familyId}`,
    orgSuspended:  (orgId)    => `auth:org_suspended:${orgId}`, // tenant kill-switch (read by gateway + authMiddleware)
};

// ── TTL constants (seconds) ────────────────────────────────────────────────────
const TTL = {
    LOGIN_WINDOW:   15 * 60,          // brute-force sliding window
    ACCESS_TOKEN:   16 * 60,          // access token lifetime + 1 min
    REFRESH_FAMILY: 7 * 24 * 60 * 60, // match refresh token lifetime
};

// ── Low-level helpers ──────────────────────────────────────────────────────────
async function _incr(key, ttlSec) {
    const r = getClient();
    if (!r || !isAvailable()) return 0;
    try {
        const [[, count]] = await r.pipeline().incr(key).expire(key, ttlSec).exec();
        return count ?? 0;
    } catch { return 0; }
}

async function _get(key) {
    const r = getClient();
    if (!r || !isAvailable()) return null;
    try { return await r.get(key); } catch { return null; }
}

async function _set(key, value, ttlSec) {
    const r = getClient();
    if (!r || !isAvailable()) return;
    try { await r.set(key, value, 'EX', ttlSec); } catch { /* graceful */ }
}

async function _del(...keys) {
    const r = getClient();
    if (!r || !isAvailable()) return;
    try { await r.del(...keys); } catch { /* graceful */ }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/** Increments both IP and email login-attempt counters. Returns current counts. */
async function incrLoginAttempts(ip, email) {
    const [ipCount, emailCount] = await Promise.all([
        _incr(K.loginByIp(ip), TTL.LOGIN_WINDOW),
        _incr(K.loginByEmail(email.toLowerCase()), TTL.LOGIN_WINDOW),
    ]);
    return { ipCount, emailCount };
}

/** Reads current counters without incrementing. */
async function getLoginAttempts(ip, email) {
    const [ip_, em_] = await Promise.all([
        _get(K.loginByIp(ip)),
        _get(K.loginByEmail(email.toLowerCase())),
    ]);
    return { ipCount: Number(ip_ ?? 0), emailCount: Number(em_ ?? 0) };
}

/** Resets counters on successful login. */
async function resetLoginAttempts(ip, email) {
    await _del(K.loginByIp(ip), K.loginByEmail(email.toLowerCase()));
}

/**
 * Adds a JWT jti to the blacklist so the token is rejected before it naturally
 * expires. Used on logout to invalidate access tokens immediately.
 */
async function blacklistToken(jti, ttlSec = TTL.ACCESS_TOKEN) {
    await _set(K.blacklist(jti), '1', ttlSec);
}

async function isTokenBlacklisted(jti) {
    return (await _get(K.blacklist(jti))) === '1';
}

/**
 * Marks an entire refresh token family as compromised after reuse is detected.
 * New verifications against any token in this family will fail fast via Redis
 * even if the DB revocation hasn't propagated yet.
 */
async function markFamilyRevoked(familyId) {
    await _set(K.familyRevoked(familyId), '1', TTL.REFRESH_FAMILY);
}

async function isFamilyRevoked(familyId) {
    return (await _get(K.familyRevoked(familyId))) === '1';
}

/**
 * Organization kill-switch. When an org is suspended we set this flag so that EVERY
 * in-flight access token bound to the org is rejected at the gateway / authMiddleware
 * BEFORE its natural 15-minute expiry — closing the window that DB session revocation
 * alone (which only stops refresh) would leave open. Re-set on each suspend; 30-day TTL
 * is a safety net only — clearOrgSuspended() removes it on reactivation.
 */
async function setOrgSuspended(orgId) {
    await _set(K.orgSuspended(orgId), '1', 30 * 24 * 60 * 60);
}

async function clearOrgSuspended(orgId) {
    await _del(K.orgSuspended(orgId));
}

async function isOrgSuspended(orgId) {
    if (!orgId) return false;
    return (await _get(K.orgSuspended(orgId))) === '1';
}

module.exports = {
    connect,
    getClient,
    isAvailable,
    TTL,
    incrLoginAttempts,
    getLoginAttempts,
    resetLoginAttempts,
    blacklistToken,
    isTokenBlacklisted,
    markFamilyRevoked,
    isFamilyRevoked,
    setOrgSuspended,
    clearOrgSuspended,
    isOrgSuspended,
};
