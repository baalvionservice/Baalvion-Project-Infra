'use strict';
const Redis = require('ioredis');

/**
 * ioredis connection factory. Upstash-compatible: a `rediss://` REDIS_URL works as-is.
 * Lazy + low retries so cache calls fail FAST and the caller can fall through to the
 * source of truth (the Cache layer is fail-open).
 */
function createRedis(opts = {}) {
    const url = opts.url || process.env.REDIS_URL || process.env.CACHE_REDIS_URL;
    const common = {
        lazyConnect: true,
        enableReadyCheck: true,
        maxRetriesPerRequest: opts.maxRetriesPerRequest ?? 2,
        connectTimeout: opts.connectTimeout ?? 3000,
        retryStrategy: (times) => Math.min(times * 200, 3000),
    };
    if (url) return new Redis(url, common);
    return new Redis({
        host: opts.host || process.env.REDIS_HOST || 'localhost',
        port: Number(opts.port || process.env.REDIS_PORT || 6379),
        password: opts.password || process.env.REDIS_PASSWORD || undefined,
        db: Number(opts.db ?? process.env.REDIS_DB ?? 0),
        ...common,
    });
}

module.exports = { createRedis };
