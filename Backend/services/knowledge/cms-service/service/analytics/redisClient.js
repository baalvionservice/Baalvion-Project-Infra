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
    // enableOfflineQueue:false is the load-bearing setting here — commandTimeout
    // ONLY bounds a command AFTER ioredis has sent it over an established
    // connection. While disconnected, ioredis's default offline queue holds
    // every command indefinitely waiting for reconnect, so a Redis outage would
    // hang dedupeService/realtimeService/the server connector's ping forever
    // despite their try/catch — silently breaking the "fail-open, never hangs"
    // guarantee this whole layer is built on. With it false, a command issued
    // while disconnected rejects immediately ("Stream isn't writeable").
    const opts = {
        maxRetriesPerRequest: 2, connectTimeout: 3000, commandTimeout: 2000,
        enableReadyCheck: false, enableOfflineQueue: false,
    };
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
    // disconnect(), not quit(): quit() sends a graceful QUIT and waits on the
    // connection — if Redis is unreachable (the exact moment graceful shutdown
    // most needs to complete promptly), quit() itself hangs waiting for a
    // connection that will never come. disconnect() tears down immediately,
    // with no round-trip required.
    try { if (client) client.disconnect(); } catch { /* noop */ }
    try { if (subscriber) subscriber.disconnect(); } catch { /* noop */ }
    client = null;
    subscriber = null;
}

module.exports = { getRedis, getSubscriber, closeRedis };
