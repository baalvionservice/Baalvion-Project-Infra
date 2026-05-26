'use strict';
const client = require('prom-client');

const SERVICE_NAME = process.env.SERVICE_NAME || 'trade-service';

const register = client.register;
register.setDefaultLabels({ service: SERVICE_NAME });
client.collectDefaultMetrics({ register, prefix: 'baalvion_node_' });

const httpRequestsTotal = new client.Counter({
    name: 'baalvion_http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status', 'service'],
    registers: [register],
});

const httpRequestDuration = new client.Histogram({
    name: 'baalvion_http_request_duration_ms',
    help: 'HTTP request duration in milliseconds',
    labelNames: ['method', 'route', 'status', 'service'],
    buckets: [10, 50, 100, 200, 500, 1000, 2000, 5000],
    registers: [register],
});

const httpActiveRequests = new client.Gauge({
    name: 'baalvion_http_active_requests',
    help: 'Currently active HTTP requests',
    labelNames: ['service'],
    registers: [register],
});

function metricsMiddleware(req, res, next) {
    if (req.path === '/metrics') return next();
    const start = Date.now();
    httpActiveRequests.inc({ service: SERVICE_NAME });
    res.on('finish', () => {
        const route = req.route ? req.baseUrl + req.route.path : req.path;
        const labels = {
            method: req.method,
            route: route.replace(/\/[0-9a-f-]{8,}/gi, '/:id'),
            status: String(res.statusCode),
            service: SERVICE_NAME,
        };
        httpRequestsTotal.inc(labels);
        httpRequestDuration.observe(labels, Date.now() - start);
        httpActiveRequests.dec({ service: SERVICE_NAME });
    });
    next();
}

// --- Dynamic gauges (queues / cache / workers), refreshed on each scrape ---
const queueJobs = new client.Gauge({
    name: 'baalvion_queue_jobs', help: 'Jobs per queue and state',
    labelNames: ['queue', 'state', 'service'], registers: [register],
});
const cacheGauge = new client.Gauge({
    name: 'baalvion_cache', help: 'Cache statistics',
    labelNames: ['metric', 'service'], registers: [register],
});
const queueWorkers = new client.Gauge({
    name: 'baalvion_queue_workers_active', help: 'Active queue workers',
    labelNames: ['service'], registers: [register],
});

async function refreshDynamicMetrics() {
    try {
        const queue = require('../queue'); // lazy to avoid load-order cycles
        const { workerMetrics } = require('../queue/workers');
        const cache = require('../cache');
        const h = await queue.health();
        for (const [q, counts] of Object.entries(h)) {
            for (const [state, n] of Object.entries(counts)) {
                queueJobs.set({ queue: q, state, service: SERVICE_NAME }, Number(n) || 0);
            }
        }
        const c = cache.health();
        cacheGauge.set({ metric: 'hits', service: SERVICE_NAME }, c.hits || 0);
        cacheGauge.set({ metric: 'misses', service: SERVICE_NAME }, c.misses || 0);
        cacheGauge.set({ metric: 'hit_rate', service: SERVICE_NAME }, c.hitRate || 0);
        cacheGauge.set({ metric: 'connected', service: SERVICE_NAME }, c.connected ? 1 : 0);
        queueWorkers.set({ service: SERVICE_NAME }, workerMetrics().active || 0);
    } catch { /* metrics scrape is best-effort */ }
}

async function metricsHandler(req, res) {
    await refreshDynamicMetrics();
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
}

module.exports = { metricsMiddleware, metricsHandler, register };
