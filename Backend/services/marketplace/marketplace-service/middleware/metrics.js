'use strict';
/**
 * Prometheus metrics, following ir-service/middleware/metrics.js.
 *
 * The point of the security counters below: this service records every refused action to the
 * audit trail — an attempted NDA bypass, a forged gateway signature, an uncleared investor
 * reaching for a term sheet, a stranger probing deal ids — and until now NOTHING WATCHED THEM.
 * An audit trail answers "what happened" after you already know to look. A counter is what tells
 * you to look.
 *
 * Alert on the rate of `baalvion_marketplace_denied_total`, especially by action: a handful of
 * denials is normal traffic, a spike on `deal.access.denied` is someone enumerating deals.
 */
const client = require('prom-client');

const SERVICE_NAME = process.env.SERVICE_NAME || 'marketplace-service';

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

/** Every refused action, by what was refused and how serious it is. */
const deniedTotal = new client.Counter({
    name: 'baalvion_marketplace_denied_total',
    help: 'Deal-room and marketplace actions refused by an authorization or policy check',
    labelNames: ['action', 'severity', 'service'],
    registers: [register],
});

/** Audit events that could not be delivered. Non-zero means the trail has a hole in it. */
const auditUndelivered = new client.Gauge({
    name: 'baalvion_marketplace_audit_undelivered',
    help: 'Audit outbox rows that have exhausted their retries and are no longer being sent',
    labelNames: ['service'],
    registers: [register],
});

/** Documents actually stored, and reads of them — a data room with no reads is not in use. */
const dataRoomOps = new client.Counter({
    name: 'baalvion_marketplace_data_room_total',
    help: 'Data-room document operations',
    labelNames: ['op', 'service'],
    registers: [register],
});

function metricsMiddleware(req, res, next) {
    if (req.path === '/metrics') return next();
    const start = Date.now();
    res.on('finish', () => {
        const route = req.route ? req.baseUrl + req.route.path : req.path;
        const labels = { method: req.method, route, status: String(res.statusCode), service: SERVICE_NAME };
        httpRequestsTotal.inc(labels);
        httpRequestDuration.observe(labels, Date.now() - start);
    });
    next();
}

async function metricsHandler(req, res) {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
}

const recordDenied = (action, severity) =>
    deniedTotal.inc({ action: action || 'unknown', severity: severity || 'info', service: SERVICE_NAME });

const setAuditUndelivered = (n) => auditUndelivered.set({ service: SERVICE_NAME }, Number(n) || 0);

const recordDataRoomOp = (op) => dataRoomOps.inc({ op, service: SERVICE_NAME });

module.exports = { metricsMiddleware, metricsHandler, recordDenied, setAuditUndelivered, recordDataRoomOp, register };
