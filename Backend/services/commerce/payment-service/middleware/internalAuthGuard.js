'use strict';
/**
 * Service-to-service guard for the gateway-checkout API (create / read payment).
 *
 * These endpoints are called by a tenant's trusted backend, not a browser, so
 * they are authenticated with the platform's internal-auth (sdk.internalAuth —
 * timing-safe shared-secret / HMAC), NOT the legacy any-Bearer stub. Verification
 * logic lives in the SDK; this is a thin adapter to the gateway error envelope.
 */
const crypto = require('node:crypto');
const { tryGetSdk } = require('../platform/sdk');
const config = require('../config/appConfig');

function timingSafeEqual(provided, expected) {
    const a = Buffer.from(provided || '');
    const b = Buffer.from(expected || '');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = function internalAuthGuard(req, res, next) {
    const sdk = tryGetSdk();
    const ok = sdk
        ? sdk.internalAuth.verify(req.headers)
        : timingSafeEqual(req.headers['x-internal-secret'], config.internalSecret);
    if (!ok) {
        return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'invalid internal service credentials' } });
    }
    req.internalCaller = req.headers['x-internal-service'] || null;
    return next();
};
