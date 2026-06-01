'use strict';
/**
 * SDK-native trace middleware for the HTTP layer. Binds a traceId (+ tenant) from
 * inbound headers via sdk.trace, exposes req.traceId, echoes x-trace-id, so logs
 * during request handling are correlated. Lazily resolves the SDK (ready after
 * initSdk() in start()); passes through untraced if the SDK isn't up (never blocks).
 */
const { tryGetSdk } = require('./sdk');

let inner = null;

module.exports = function traceMiddleware(req, res, next) {
    const sdk = tryGetSdk();
    if (!sdk) return next();
    if (!inner) inner = sdk.trace.middleware();
    inner(req, res, () => {
        if (req.trace && req.trace.traceId) req.traceId = req.trace.traceId;
        next();
    });
};
