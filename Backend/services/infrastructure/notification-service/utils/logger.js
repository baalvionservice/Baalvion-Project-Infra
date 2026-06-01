'use strict';
/**
 * Logger facade — delegates to sdk.logger (structured + trace-stamped) once the SDK
 * is initialised, and to a base pino instance before that (early boot / CLI). Every
 * existing `require('../utils/logger')` call site keeps working unchanged; logs
 * emitted during request/event processing now carry the active traceId + tenantId.
 */
const pino = require('pino');
const { tryGetSdk } = require('../platform/sdk');

// Fallback sink (pre-SDK-init). Keeps the prior redaction + service base.
const base = pino({
    level: process.env.LOG_LEVEL || 'info',
    ...(process.env.NODE_ENV !== 'production' && { transport: { target: 'pino-pretty', options: { colorize: true } } }),
    redact: ['email', 'to', 'password', 'apiKey', 'req.headers.authorization'],
    base: { service: 'notification-service' },
});

function active(bindings) {
    const sdk = tryGetSdk();
    if (sdk) return bindings ? sdk.logger.child(bindings) : sdk.logger;
    return bindings ? base.child(bindings) : base;
}

module.exports = {
    trace: (o, m) => active().trace(o, m),
    debug: (o, m) => active().debug(o, m),
    info:  (o, m) => active().info(o, m),
    warn:  (o, m) => active().warn(o, m),
    error: (o, m) => active().error(o, m),
    fatal: (o, m) => active().error(o, m), // sdk.logger has no fatal → map to error
    child: (bindings) => active(bindings),
};
