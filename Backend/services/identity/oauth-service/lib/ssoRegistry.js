'use strict';
const redis = require('../config/redis');

// Tracks which RP clients have an active session under a given hub session id (sid), so a logout
// can cascade a back-channel logout to exactly those RPs. Best-effort: all ops no-op when Redis is
// down (logout still ends the OP session; only the cascade is skipped).
const key = (sid) => `sso:logout:sid:${sid}`;

async function recordClientForSession(sid, clientId, ttlSec = 86400) {
    if (!sid || !clientId) return;
    const r = redis.getClient();
    if (!r || !redis.isAvailable()) return;
    try { await r.sadd(key(sid), clientId); await r.expire(key(sid), ttlSec); } catch { /* best-effort */ }
}

async function getClientsForSession(sid) {
    if (!sid) return [];
    const r = redis.getClient();
    if (!r || !redis.isAvailable()) return [];
    try { return await r.smembers(key(sid)); } catch { return []; }
}

async function clearSession(sid) {
    if (!sid) return;
    const r = redis.getClient();
    if (!r || !redis.isAvailable()) return;
    try { await r.del(key(sid)); } catch { /* best-effort */ }
}

module.exports = { recordClientForSession, getClientsForSession, clearSession };
