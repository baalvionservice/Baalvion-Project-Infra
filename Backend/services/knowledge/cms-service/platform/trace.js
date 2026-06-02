'use strict';
/**
 * SDK-native trace middleware (CommonJS runtime).
 *
 * Derives/propagates a traceId (+ tenantId) from inbound headers via
 * sdk.trace.middleware(), binds it to the request's async context, exposes it as
 * `req.traceId`, and echoes `x-trace-id` on the response. Every sdk.logger /
 * sdk.http / sdk.events call within the request then carries this id automatically.
 *
 * Mount this once, before the route layer. The underlying SDK middleware is
 * created lazily on first request — by which point initSdk() has completed in
 * bootstrap (it runs before app.listen()). If the SDK is somehow unavailable, the
 * request is passed through untraced rather than blocked (behaviour-preserving).
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
