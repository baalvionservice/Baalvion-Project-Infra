'use strict';
/**
 * Shared ioredis client for the analytics runtime (dedupe + realtime pub/sub).
 * Fail-open: connection errors are swallowed so a Redis blip never crashes the
 * collector or a worker; callers guard each command with try/catch.
 */
const IORedis = require('ioredis');
const config = require('../../config/appConfig');
const { logger } = require('../../platform/logger');

let client = null;
let subscriber = null;

function build() {
    const opts = { maxRetriesPerRequest: 2, connectTimeout: 3000, enableReadyCheck: false };
    const c = process.env.REDIS_URL
        ? new IORedis(process.env.REDIS_URL, opts)
        : new IORedis({ host: config.redis.host, port: config.redis.port, password: config.redis.password || undefined, ...opts });
    c.on('error', (err) => { try { logger('analytics-redis').debug({ err: err && err.message }, 'redis error (fail-open)'); } catch { /* noop */ } });
    return c;
}

/** Command client (shared). */
function getRedis() {
    if (!client) client = build();
    return client;
}

/** Dedicated subscriber connection (pub/sub can't share a command client). */
function getSubscriber() {
    if (!subscriber) subscriber = build();
    return subscriber;
}

async function closeRedis() {
    await Promise.allSettled([client && client.quit(), subscriber && subscriber.quit()]);
    client = null;
    subscriber = null;
}

module.exports = { getRedis, getSubscriber, closeRedis };
