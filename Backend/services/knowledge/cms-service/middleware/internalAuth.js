'use strict';
const crypto = require('node:crypto');
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');
const { tryGetSdk } = require('../platform/sdk');

/** Constant-time secret comparison (matches the SDK's own internal-auth check). */
function timingSafeEqual(provided, expected) {
    const a = Buffer.from(provided || '');
    const b = Buffer.from(expected || '');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Service-to-service (internal) guard for endpoints like the keys resolver.
 *
 * The verification LOGIC lives in the SDK (sdk.internalAuth — timing-safe
 * comparison, the standardized `x-internal-secret` scheme shared platform-wide).
 * This middleware is only a thin adapter that maps the result onto cms-service's
 * error envelope (AppError → sendError), so the wire contract is byte-identical
 * to before: 200 with the secret, 401 without.
 *
 * The direct-equality branch is a defensive fallback for the (practically
 * impossible) case of a request arriving before initSdk() completes — the
 * listener only starts after the SDK is ready, so in the running service the SDK
 * path is always taken.
 */
module.exports = function internalAuth(req, res, next) {
    const sdk = tryGetSdk();
    const ok = sdk
        ? sdk.internalAuth.verify(req.headers)
        : timingSafeEqual(req.headers['x-internal-secret'], config.internalSecret);
    if (!ok) {
        return next(new AppError('UNAUTHORIZED', 'Invalid or missing internal service secret', 401));
    }
    return next();
};
