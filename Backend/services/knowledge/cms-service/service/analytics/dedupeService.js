'use strict';
/**
 * Event deduplication (replay / double-fire suppression).
 *
 * A beacon can fire the same event twice (sendBeacon + fetch fallback, retries,
 * bfcache restores). We suppress duplicates with a short-lived Redis SET NX on a
 * stable dedupe key. Fail-open: if Redis is unavailable we admit the event rather
 * than risk dropping real data.
 */
const { getRedis } = require('./redisClient');

const TTL_SEC = Number(process.env.ANALYTICS_DEDUPE_TTL_SEC || 120);

/** Derive a stable dedupe key when the client didn't supply one. */
function computeDedupeKey(evt) {
    if (evt.dedupeKey) return String(evt.dedupeKey).slice(0, 200);
    const minute = String(evt.occurredAt || '').slice(0, 16); // minute bucket
    return [evt.websiteId, evt.visitorId || '', evt.sessionId || '', evt.event, evt.page || '', minute].join('|');
}

/** True if this dedupe key was already seen within the window. Fail-open → false. */
async function isDuplicate(dedupeKey) {
    if (!dedupeKey) return false;
    try {
        const res = await getRedis().set(`an:dd:${dedupeKey}`, '1', 'EX', TTL_SEC, 'NX');
        return res === null; // NX returns null when the key already existed
    } catch {
        return false; // never drop real data on a Redis error
    }
}

module.exports = { computeDedupeKey, isDuplicate, TTL_SEC };
