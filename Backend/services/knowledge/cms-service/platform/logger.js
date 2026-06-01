'use strict';
/**
 * Structured, trace-stamped logging for cms-service — the SDK-native replacement
 * for `console.*`.
 *
 * `logger(module)` returns an SDK child logger bound to `{ module }`. Every line
 * it emits is automatically stamped with the current traceId + tenantId by the
 * SDK (see sdk.logger / sdk.trace), so correlation needs no manual plumbing.
 *
 * Before the SDK is initialised (very early boot, or CLI/seed scripts that import
 * a service directly), it falls back to a minimal JSON console shim with the same
 * call signature — so logging never crashes and never blocks adoption.
 */
const { tryGetSdk } = require('./sdk');

const fallbackCache = new Map();

function makeFallback(module, bindings = {}) {
    const base = { service: 'cms-service', ...(module ? { module } : {}), ...bindings };
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
        // Preserve module + accumulate child bindings (e.g. { tenant }), matching
        // the SDK logger's child() semantics.
        child(extra) { return makeFallback(module, { ...bindings, ...extra }); },
    };
}

function fallbackLogger(module) {
    const key = module || '_root';
    let l = fallbackCache.get(key);
    if (!l) { l = makeFallback(module); fallbackCache.set(key, l); }
    return l;
}

/**
 * Get a logger, optionally bound to a module name (e.g. logger('cache')).
 * Returns an SDK logger when initialised, else a console-shim fallback.
 */
function logger(module) {
    const sdk = tryGetSdk();
    if (sdk) return module ? sdk.logger.child({ module }) : sdk.logger;
    return fallbackLogger(module);
}

module.exports = { logger };
