'use strict';
// In-app / realtime channel. Publishes to Redis pub/sub (realtime-service fans it
// out over WebSocket to the connected user) AND stores it in a per-user inbox list
// so it can be fetched later, with read/unread tracking.
const crypto = require('crypto');
const config = require('../config/appConfig');
const redis  = require('../config/redis');
const logger = require('../utils/logger');

const inboxKey = (userId) => `${config.keys.inbox}:${userId}`;
const readKey  = (userId) => `${config.keys.inbox}:read:${userId}`;
const channel  = (userId) => `${config.inapp.channelPrefix}:${userId}`;

async function sendInApp({ userId, title, body, data = {}, type = 'notification', idempotencyKey }) {
    if (!userId) throw new Error('in-app notification requires `userId`');
    const r = redis.getClient();
    if (!r || !redis.isAvailable()) {
        logger.warn({ userId }, '[inapp] Redis unavailable — notification dropped');
        return { delivered: false, reason: 'redis_unavailable' };
    }
    const entry = { id: idempotencyKey || crypto.randomUUID(), type, title, body, data, ts: new Date().toISOString() };
    const json = JSON.stringify(entry);

    // 1) realtime push (best-effort; realtime-service subscribers receive instantly)
    const subscribers = await r.publish(channel(userId), json);

    // 2) durable inbox (capped + TTL)
    await r.lpush(inboxKey(userId), json);
    await r.ltrim(inboxKey(userId), 0, config.inapp.inboxMax - 1);
    await r.expire(inboxKey(userId), config.inapp.inboxTtlSec);

    logger.info({ userId, id: entry.id, subscribers }, 'In-app notification delivered');
    return { delivered: true, id: entry.id, realtimeSubscribers: subscribers };
}

async function getInbox(userId, { limit = 50 } = {}) {
    const r = redis.getClient();
    if (!r) return { items: [], unread: 0 };
    const [raw, readIds] = await Promise.all([
        r.lrange(inboxKey(userId), 0, limit - 1),
        r.smembers(readKey(userId)),
    ]);
    const readSet = new Set(readIds);
    let unread = 0;
    const items = raw.map((j) => {
        let e = {}; try { e = JSON.parse(j); } catch (err) { logger.warn({ err: err && err.message, userId }, 'getInbox: skipping unparseable inbox entry'); }
        const read = readSet.has(e.id);
        if (!read) unread++;
        return { ...e, read };
    });
    return { items, unread };
}

async function markRead(userId, id) {
    const r = redis.getClient();
    if (!r) throw new Error('Redis unavailable');
    await r.sadd(readKey(userId), id);
    await r.expire(readKey(userId), config.inapp.inboxTtlSec);
    return { userId, id, read: true };
}

async function markAllRead(userId) {
    const r = redis.getClient();
    if (!r) throw new Error('Redis unavailable');
    const raw = await r.lrange(inboxKey(userId), 0, -1);
    const ids = raw.map((j) => { try { return JSON.parse(j).id; } catch { return null; } }).filter(Boolean);
    if (ids.length) { await r.sadd(readKey(userId), ...ids); await r.expire(readKey(userId), config.inapp.inboxTtlSec); }
    return { userId, markedRead: ids.length };
}

module.exports = { sendInApp, getInbox, markRead, markAllRead };
