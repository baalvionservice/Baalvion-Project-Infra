'use strict';
/**
 * Structured, trace-stamped logging for payment-service — the SDK-native
 * replacement for console logging / winston. `logger(module)` returns an SDK child logger
 * bound to `{ module }`; every line carries the current traceId + tenantId.
 * Before the SDK is initialised (early boot / CLI scripts) it falls back to a
 * minimal JSON console shim with the same signature, so logging never crashes.
 */
const { tryGetSdk } = require('./sdk');

const fallbackCache = new Map();

function makeFallback(module, bindings = {}) {
    const base = { service: 'payment-service', ...(module ? { module } : {}), ...bindings };
    const emit = (level, sink) => (obj, msg) => {
        const fields = typeof obj === 'string' ? { msg: obj } : { ...obj, ...(msg ? { msg } : {}) };
        sink(JSON.stringify({ level, time: new Date().toISOString(), ...base, ...fields }));
    };
    return {
        trace: emit('trace', console.log),
        debug: emit('debug', console.log),
        info: emit('info', console.log),
        warn: emit('warn', console.warn),
        error: emit('error', console.error),
        child(extra) { return makeFallback(module, { ...bindings, ...extra }); },
    };
}

function fallbackLogger(module) {
    const key = module || '_root';
    let l = fallbackCache.get(key);
    if (!l) { l = makeFallback(module); fallbackCache.set(key, l); }
    return l;
}

function logger(module) {
    const sdk = tryGetSdk();
    if (sdk) return module ? sdk.logger.child({ module }) : sdk.logger;
    return fallbackLogger(module);
}

module.exports = { logger };
