'use strict';

// Live storefront presence — counts the anonymous shoppers active on a store RIGHT NOW.
//
// Model: a per-store Redis sorted set `commerce:presence:<storeId>` whose members are
// opaque client-generated visitor ids and whose scores are the last-seen epoch ms. A
// visitor "counts" while it pinged within PRESENCE_WINDOW_MS; stale members are pruned on
// every read/write and the key carries a TTL so it self-cleans when the store goes quiet.
//
// Redis is the source of truth (multiple commerce-service instances share one count). If
// Redis is unavailable the API degrades to a count of 0 — it NEVER throws into the public
// storefront request path.
//
// NOTE: this count is a non-authoritative vanity metric (an anonymous client can inflate it).
// It must never be used as a security, pricing, or capacity control.

const cache = require('./cacheService');

// How long a single heartbeat keeps a visitor "live". The storefront pings well inside this
// window (~25s); the slack absorbs one missed beat / network jitter without flicker.
const WINDOW_MS = Math.max(5_000, Number(process.env.PRESENCE_WINDOW_MS || 45_000));
// Hard cap on distinct visitor ids tracked per store, so a flood can't grow the set unbounded.
const MAX_TRACKED = Math.max(1, Number(process.env.PRESENCE_MAX_TRACKED || 50_000));

// storeId arrives as a URL path param and becomes a Redis KEY (not a DB-parameterized value),
// so constrain it to a safe, bounded token. This blocks key-namespace poisoning and stops a
// malformed/rotating id from spawning unbounded presence keys that evade the per-store cap.
const STORE_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

const keyFor = (storeId) => `commerce:presence:${storeId}`;

function safeStoreId(raw) {
    const s = String(raw || '').trim();
    return STORE_ID_RE.test(s) ? s : '';
}

// Trim a client-supplied id to a safe, bounded token (the schema already caps length; this is
// belt-and-suspenders so nothing odd reaches Redis as a member name).
function safeVisitorId(raw) {
    const s = String(raw || '').trim();
    return s ? s.slice(0, 100) : '';
}

// Pull the ZCARD value out of an ioredis multi() result ([ [err, val], ... ]) at `idx`,
// treating a per-command error or any malformed shape as 0.
function cardAt(res, idx) {
    const entry = Array.isArray(res) ? res[idx] : null;
    if (!entry || entry[0] != null) return 0;
    const n = Number(entry[1]);
    return Number.isFinite(n) ? n : 0;
}

/**
 * Record a heartbeat for one visitor and return the store's current live count.
 * Single Redis round-trip: register → prune stale + overflow → refresh TTL → read count.
 * Fails soft: any Redis error resolves to { count: 0 } rather than throwing.
 */
async function heartbeat(storeId, visitorId) {
    const sid = safeStoreId(storeId);
    const id = safeVisitorId(visitorId);
    if (!sid || !id) return { count: 0 };
    try {
        const key = keyFor(sid);
        const now = Date.now();
        const res = await cache
            .getClient()
            .multi()
            .zadd(key, now, id)
            .zremrangebyscore(key, '-inf', now - WINDOW_MS)
            // Defensive cap: if the set somehow exceeds MAX_TRACKED, drop the oldest beyond it.
            .zremrangebyrank(key, 0, -(MAX_TRACKED + 1))
            .pexpire(key, WINDOW_MS * 3)
            .zcard(key)
            .exec();
        return { count: cardAt(res, 4) };
    } catch (err) {
        // Storefront path must never fail over presence — degrade to 0.
        return { count: 0 };
    }
}

/**
 * Read the store's current live visitor count without recording a heartbeat (admin polling).
 * Prunes stale members first so the count is fresh. Fails soft to { count: 0 }.
 */
async function count(storeId) {
    const sid = safeStoreId(storeId);
    if (!sid) return { count: 0 };
    try {
        const key = keyFor(sid);
        const res = await cache
            .getClient()
            .multi()
            .zremrangebyscore(key, '-inf', Date.now() - WINDOW_MS)
            .zcard(key)
            .exec();
        return { count: cardAt(res, 1) };
    } catch (err) {
        return { count: 0 };
    }
}

module.exports = { heartbeat, count, WINDOW_MS };
