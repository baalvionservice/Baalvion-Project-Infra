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
 * Service-to-service (internal) guard — mirrors cms-service's middleware/internalAuth.js
 * byte-for-byte so the `x-internal-secret` scheme behaves identically in both directions
 * (cms-service already calls INTO imperialpedia-service's future endpoints the same way
 * imperialpedia-service calls cms-service's /internal/* today — see service/payments.js,
 * service/entityMentionDetectionService.js).
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
