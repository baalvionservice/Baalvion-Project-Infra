'use strict';

/**
 * Prometheus metrics using prom-client.
 *
 * Packages required (listed in devDependencies):
 *   prom-client
 *
 * Usage — mount the /metrics endpoint in Express:
 *
 *   const { metricsMiddleware, getMetrics } = require('./observability/metrics');
 *
 *   // Apply globally before routes to capture all requests
 *   app.use(metricsMiddleware);
 *
 *   // Scrape endpoint (restrict to internal network / auth in prod)
 *   app.get('/metrics', async (req, res) => {
 *     res.set('Content-Type', register.contentType);
 *     res.end(await getMetrics());
 *   });
 */

const client = require('prom-client');

// Collect default Node.js metrics (event loop lag, GC, heap, etc.)
client.collectDefaultMetrics({ prefix: 'baalvion_' });

// ---------------------------------------------------------------------------
// Custom metrics
// ---------------------------------------------------------------------------

/**
 * httpRequestDuration — tracks response latency per method / route / status.
 *
 * Metric name: http_request_duration_seconds
 */
const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

/**
 * httpRequestTotal — counts requests per method / route / status.
 *
 * Metric name: http_requests_total
 */
const httpRequestTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});

/**
 * activeConnections — gauge that tracks currently open HTTP connections.
 *
 * Metric name: http_active_connections
 */
const activeConnections = new client.Gauge({
    name: 'http_active_connections',
    help: 'Number of currently active HTTP connections',
});

// ---------------------------------------------------------------------------
// Express middleware
// ---------------------------------------------------------------------------

/**
 * metricsMiddleware — record duration and status for every request.
 *
 * @type {import('express').RequestHandler}
 */
function metricsMiddleware(req, res, next) {
    activeConnections.inc();

    const end = httpRequestDuration.startTimer();

    res.on('finish', () => {
        // Normalise dynamic segments to avoid high-cardinality labels.
        // Express sets req.route.path once the route is matched.
        const route = req.route
            ? req.route.path
            : req.path.replace(/\/[0-9a-f-]{8,}/gi, '/:id'); // naive fallback

        const labels = {
            method:      req.method,
            route,
            status_code: String(res.statusCode),
        };

        end(labels);
        httpRequestTotal.inc(labels);
        activeConnections.dec();
    });

    next();
}

// ---------------------------------------------------------------------------
// Scrape helper
// ---------------------------------------------------------------------------

/**
 * getMetrics — returns all registered metrics as a Prometheus text payload.
 *
 * @returns {Promise<string>}
 */
async function getMetrics() {
    return client.register.metrics();
}

const register = client.register;

module.exports = {
    httpRequestDuration,
    httpRequestTotal,
    activeConnections,
    metricsMiddleware,
    getMetrics,
    register,
};
