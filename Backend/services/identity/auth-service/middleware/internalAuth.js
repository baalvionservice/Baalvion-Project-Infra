'use strict';
// Internal service-to-service auth (S2S HMAC). Guards POST /v1/auth/issue-on-behalf so that
// ONLY trusted island services — which have already authenticated a user LOCALLY and sign with
// the shared INTERNAL_SERVICE_SECRET — can request a canonical RS256 token on that user's behalf.
//
// Signature contract: HMAC-SHA256( `${service}.${timestamp}.${rawBody}`, INTERNAL_SERVICE_SECRET )
// where rawBody = JSON.stringify(parsed body). Headers: x-internal-service / x-internal-timestamp
// / x-internal-signature. Timestamp freshness blocks replay; comparison is constant-time.
const crypto = require('crypto');
const { AppError } = require('../utils/errors');

const SECRET = process.env.INTERNAL_SERVICE_SECRET || '';
const MAX_SKEW_MS = Number(process.env.INTERNAL_MAX_SKEW_MS || 5 * 60 * 1000);
const ALLOWED = (process.env.INTERNAL_SERVICE_ALLOWLIST || 'law,trade,insiders')
    .split(',').map((s) => s.trim()).filter(Boolean);

function safeEqualHex(a, b) {
    const ab = Buffer.from(String(a), 'utf8');
    const bb = Buffer.from(String(b), 'utf8');
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
}

module.exports = function internalAuth(req, res, next) {
    if (!SECRET) return next(new AppError('CONFIG_ERROR', 'INTERNAL_SERVICE_SECRET not configured', 500));
    const service = req.headers['x-internal-service'];
    const ts      = req.headers['x-internal-timestamp'];
    const sig     = req.headers['x-internal-signature'];
    if (!service || !ts || !sig) return next(new AppError('UNAUTHORIZED', 'Missing internal service credentials', 401));
    if (!ALLOWED.includes(String(service))) return next(new AppError('FORBIDDEN', `Service '${service}' not allowed`, 403));
    const skew = Math.abs(Date.now() - Number(ts));
    if (!Number.isFinite(skew) || skew > MAX_SKEW_MS) return next(new AppError('UNAUTHORIZED', 'Stale or invalid internal timestamp', 401));
    const rawBody = JSON.stringify(req.body || {});
    const expected = crypto.createHmac('sha256', SECRET).update(`${service}.${ts}.${rawBody}`).digest('hex');
    if (!safeEqualHex(sig, expected)) return next(new AppError('UNAUTHORIZED', 'Invalid internal signature', 401));
    req.internalService = String(service);
    return next();
};
