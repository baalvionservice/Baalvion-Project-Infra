'use strict';
/**
 * Session-level revocation.
 *
 * The gap this closes: revoking a token by `jti` requires knowing the jti, and the issuer
 * keeps no record of every access token it has minted. So a password reset — the one moment
 * when ending a session matters most — had nothing to write. Database revocation stopped the
 * next refresh and left the access token already in the browser working until it expired,
 * which was measured at up to fifteen minutes.
 *
 * These tests pin the three properties that make the fix trustworthy: the key is the shared
 * canonical one, a revoked session is rejected, and a store outage fails CLOSED rather than
 * waving tokens through.
 */
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    SESSION_REVOKED_PREFIX, sessionRevokedKey, createRedisSessionRevocation,
    revokeSession, SESSION_REVOCATION_TTL,
} = require('../blacklist');

/** A minimal ioredis-shaped stub: async get and set(key, val, 'EX', seconds). */
function fakeRedis() {
    const store = new Map();
    return {
        store,
        get: async (k) => (store.has(k) ? store.get(k) : null),
        set: async (k, v, mode, ttl) => { store.set(k, v); store.set(`${k}::ttl`, ttl); return 'OK'; },
    };
}

test('the key lives in the one canonical namespace', () => {
    // The whole point of defining it in this package is that the issuer and every verifier
    // agree. A service inventing its own prefix would revoke into a store nobody reads.
    assert.equal(sessionRevokedKey('abc'), `${SESSION_REVOKED_PREFIX}abc`);
    assert.ok(SESSION_REVOKED_PREFIX.startsWith('auth:'));
    assert.notEqual(SESSION_REVOKED_PREFIX, 'auth:blacklist:');
});

test('revoking writes the marker with an expiry', async () => {
    const redis = fakeRedis();
    await revokeSession(redis, 'sid-1');
    assert.equal(redis.store.get(sessionRevokedKey('sid-1')), '1');
    // It self-expires: only tokens issued BEFORE the revocation matter, and those are
    // short-lived, so the marker must outlive them and then go.
    assert.equal(redis.store.get(`${sessionRevokedKey('sid-1')}::ttl`), SESSION_REVOCATION_TTL);
});

test('the marker outlives any access token that could still be in flight', () => {
    // 15-minute access tokens plus clock skew. A shorter TTL would reopen the window it exists
    // to close.
    assert.ok(SESSION_REVOCATION_TTL >= 15 * 60);
});

test('a revoked session reads as revoked, an untouched one does not', async () => {
    const redis = fakeRedis();
    const isRevoked = createRedisSessionRevocation(redis);
    assert.equal(await isRevoked('sid-1'), false);
    await revokeSession(redis, 'sid-1');
    assert.equal(await isRevoked('sid-1'), true);
    // Revoking one session must not touch another — a reset ends this account's sessions,
    // not everybody's.
    assert.equal(await isRevoked('sid-2'), false);
});

test('an absent sid is not treated as revoked', async () => {
    const isRevoked = createRedisSessionRevocation(fakeRedis());
    assert.equal(await isRevoked(undefined), false);
    assert.equal(await isRevoked(null), false);
    assert.equal(await isRevoked(''), false);
});

test('a store outage propagates so the verifier can fail CLOSED', async () => {
    // The verifier turns this into a rejection. If it were swallowed and reported "not
    // revoked", a Redis outage would silently reinstate every revoked session.
    const broken = { get: async () => { throw new Error('connection refused'); }, set: async () => 'OK' };
    const isRevoked = createRedisSessionRevocation(broken);
    await assert.rejects(() => isRevoked('sid-1'), /connection refused/);
});

test('the helpers refuse a client that cannot do the job', () => {
    assert.throws(() => createRedisSessionRevocation(null), /requires a redis client/);
    assert.throws(() => createRedisSessionRevocation({}), /requires a redis client/);
});

test('revoking without a sid is a programming error, not a silent no-op', async () => {
    // A silent no-op here would mean a password reset that quietly revoked nothing.
    await assert.rejects(() => revokeSession(fakeRedis(), null), /requires a sid/);
    await assert.rejects(() => revokeSession(fakeRedis(), ''), /requires a sid/);
    await assert.rejects(() => revokeSession({}, 'sid-1'), /requires a redis client/);
});

test('session revocation and jti blacklisting are separate namespaces', async () => {
    // Sharing a prefix would make a revoked session look like a blacklisted token id and vice
    // versa, and one would mask the other.
    const { blacklistKey } = require('../blacklist');
    assert.notEqual(sessionRevokedKey('same-value'), blacklistKey('same-value'));
});
