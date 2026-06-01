'use strict';
/**
 * SDK-native trace middleware. Derives/propagates a traceId (+ tenantId) from
 * inbound headers via sdk.trace, exposes it as `req.traceId`, and echoes
 * `x-trace-id` on the response — so every sdk.logger / sdk.http / sdk.events call
 * in the request is correlated. Mount once, before the route layer. Passes the
 * request through untraced (never blocks) if the SDK is somehow unavailable.
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
