'use strict';
// Shared rate-limit + idempotency helpers (same Redis pattern emailService uses
// inline). Fail-open: if Redis is down, allow the send rather than drop it.
const redis = require('../config/redis');

async function checkRateLimit(channel, recipient, maxPerHour) {
    const r = redis.getClient();
    if (!r || !redis.isAvailable()) return true;
    const key = `notif:rl:${channel}:${recipient}`;
    const count = await r.incr(key);
    if (count === 1) await r.expire(key, 3600);
    return count <= maxPerHour;
}

/** Returns true if this idempotencyKey was already used (i.e. duplicate). */
async function isDuplicate(idempotencyKey) {
    if (!idempotencyKey) return false;
    const r = redis.getClient();
    if (!r || !redis.isAvailable()) return false;
    const set = await r.set(`notif:idem:${idempotencyKey}`, '1', 'EX', 86400, 'NX');
    return set === null; // null => key already existed
}

module.exports = { checkRateLimit, isDuplicate };
