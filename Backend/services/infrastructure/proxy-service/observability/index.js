'use strict';

/**
 * Observability barrel — re-exports tracing and metrics in one import.
 *
 * Usage:
 *   const { startTracing, tracer, metricsMiddleware, getMetrics } =
 *     require('./observability');
 */

const tracing = require('./tracing');
const metrics = require('./metrics');

module.exports = {
    // tracing
    startTracing:    tracing.startTracing,
    tracer:          tracing.tracer,

    // metrics
    httpRequestDuration: metrics.httpRequestDuration,
    httpRequestTotal:    metrics.httpRequestTotal,
    activeConnections:   metrics.activeConnections,
    metricsMiddleware:   metrics.metricsMiddleware,
    getMetrics:          metrics.getMetrics,
    register:            metrics.register,
};
