'use strict';
/**
 * Server Analytics connector (internal, no credentials).
 *
 * Snapshots process + infrastructure health signals for the Infra module:
 * memory (RSS/heap), event-loop lag, load average, and Postgres/Redis
 * reachability latency. These signals are process-wide, not per-site, but are
 * replicated per website (same batch pattern as internal_cms) so every site's
 * Infra tab reads them through the same provider_metrics contract as any
 * other connector.
 */
const os = require('node:os');
const { performance } = require('node:perf_hooks');

async function measureEventLoopLagMs() {
    const start = performance.now();
    await new Promise((resolve) => setImmediate(resolve));
    return Math.round((performance.now() - start) * 100) / 100;
}

async function measureRedisPingMs() {
    try {
        const { getRedis } = require('../service/analytics/redisClient');
        const start = performance.now();
        // Defense in depth: the shared client already sets enableOfflineQueue:false
        // (see redisClient.js) so a disconnected ping rejects immediately, but race
        // it against a manual timeout too rather than depend solely on that.
        await Promise.race([
            getRedis().ping(),
            new Promise((_, reject) => setTimeout(() => reject(new Error('redis ping timeout')), 2000)),
        ]);
        return Math.round((performance.now() - start) * 100) / 100;
    } catch {
        return null;
    }
}

async function measureDbPingMs() {
    try {
        const db = require('../models');
        const start = performance.now();
        // Sequelize's pool has no built-in fast-fail on a dead DB (its default acquire
        // timeout is 60s) — race it against a short manual timeout so an outage can
        // never stall this snapshot; the whole call is still wrapped in try/catch below.
        await Promise.race([
            db.sequelize.query('SELECT 1'),
            new Promise((_, reject) => setTimeout(() => reject(new Error('db ping timeout')), 2000)),
        ]);
        return Math.round((performance.now() - start) * 100) / 100;
    } catch {
        return null;
    }
}

module.exports = {
    id: 'server',
    provider: 'server',
    category: 'infra',
    requiredCreds: [],
    validate() { /* no credentials to validate */ },

    async sync() {
        const today = new Date().toISOString().slice(0, 10);
        const mem = process.memoryUsage();
        const [eventLoopLagMs, redisPingMs, dbPingMs] = await Promise.all([
            measureEventLoopLagMs(), measureRedisPingMs(), measureDbPingMs(),
        ]);

        const snap = (metric, value) => ({ metric, dims: {}, value, granularity: 'snapshot', periodStart: today, periodEnd: today });
        const out = [
            snap('rssMb', Math.round(mem.rss / 1024 / 1024)),
            snap('heapUsedMb', Math.round(mem.heapUsed / 1024 / 1024)),
            snap('loadAvg1m', Math.round(os.loadavg()[0] * 100) / 100),
            snap('eventLoopLagMs', eventLoopLagMs),
            snap('uptimeS', Math.round(process.uptime())),
        ];
        if (dbPingMs != null) out.push(snap('dbPingMs', dbPingMs));
        if (redisPingMs != null) out.push(snap('redisPingMs', redisPingMs));
        return out;
    },
};
