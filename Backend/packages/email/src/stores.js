'use strict';

/**
 * Email log / delivery-status persistence.
 *
 * The EmailService depends on an abstract store (dependency injection) so it stays storage-agnostic.
 * Every outgoing email records: recipient, sender, template, status, timestamp, messageId,
 * configurationSet. SNS events later flip `status` (delivered / bounced / complained …).
 *
 * Two implementations ship here:
 *  - NoopStore: structured-log only (safe default; never throws, never blocks a send).
 *  - createRedisStore: durable status in Redis (hash per messageId + a recent-activity stream),
 *    matching the notification-service's existing Redis-first persistence model.
 *
 * @typedef {Object} EmailLogEntry
 * @property {string} messageId
 * @property {string} recipient
 * @property {string} sender
 * @property {string} template
 * @property {string} category
 * @property {string} status         queued | sent | delivered | bounced | complained | rejected | failed
 * @property {string} timestamp      ISO-8601
 * @property {string} [configurationSet]
 * @property {string} [error]
 */

/** Default store: logs only. Never throws — logging must not break a send. */
class NoopStore {
    constructor(logger = console) {
        this.logger = logger;
    }
    async record(entry) {
        try {
            this.logger.info ? this.logger.info({ email: entry }, '[email] log') : this.logger.log('[email] log', entry);
        } catch { /* logging must never throw */ }
    }
    async updateStatus(messageId, status, event = {}) {
        try {
            this.logger.info ? this.logger.info({ messageId, status, event }, '[email] status') : this.logger.log('[email] status', messageId, status);
        } catch { /* ignore */ }
    }
    async get() { return null; }
}

/**
 * Redis-backed store. Keys (all TTL'd) live under a configurable prefix.
 *   <prefix>:msg:<messageId>     HASH   full log entry + latest status
 *   <prefix>:recent             STREAM capped list of recent send/delivery events
 *
 * @param {import('ioredis').Redis | { hset:Function, expire:Function, hgetall:Function, xadd:Function }} redisClient
 * @param {{ prefix?: string, ttlSeconds?: number, logger?: any }} [opts]
 */
function createRedisStore(redisClient, opts = {}) {
    const prefix = opts.prefix || 'email:log';
    const ttl = opts.ttlSeconds || 60 * 60 * 24 * 30; // 30 days
    const logger = opts.logger || console;
    const msgKey = (id) => `${prefix}:msg:${id}`;
    const streamKey = `${prefix}:recent`;

    const safe = async (fn, label) => {
        try { return await fn(); } catch (err) {
            // Persistence is best-effort — a Redis hiccup must never fail an email send.
            (logger.warn || logger.log).call(logger, { err: err && err.message }, `[email] store ${label} failed`);
            return null;
        }
    };

    return {
        async record(entry) {
            await safe(async () => {
                const flat = [];
                for (const [k, v] of Object.entries(entry)) flat.push(k, v == null ? '' : String(v));
                await redisClient.hset(msgKey(entry.messageId), ...flat);
                await redisClient.expire(msgKey(entry.messageId), ttl);
                if (redisClient.xadd) {
                    await redisClient.xadd(streamKey, 'MAXLEN', '~', '1000', '*',
                        'messageId', entry.messageId, 'recipient', entry.recipient,
                        'template', entry.template || '', 'status', entry.status, 'ts', entry.timestamp);
                }
            }, 'record');
        },
        async updateStatus(messageId, status, event = {}) {
            await safe(async () => {
                await redisClient.hset(msgKey(messageId),
                    'status', status,
                    'lastEvent', JSON.stringify(event).slice(0, 4000),
                    'updatedAt', new Date().toISOString());
                await redisClient.expire(msgKey(messageId), ttl);
            }, 'updateStatus');
        },
        async get(messageId) {
            return safe(async () => {
                const h = await redisClient.hgetall(msgKey(messageId));
                return h && Object.keys(h).length ? h : null;
            }, 'get');
        },
    };
}

module.exports = { NoopStore, createRedisStore };
