'use strict';
// Canonical auth (Phase 3): RS256 verification via @baalvion/auth-node's One True
// Verifier (createAuthMiddleware). Local RSA key resolution + HMAC service auth stay here.
const fs     = require('fs');
const crypto = require('crypto');
const { createAuthMiddleware } = require('@baalvion/auth-node');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');

let _publicKey = null;
function getPublicKey() {
    if (_publicKey) return _publicKey;
    if (config.jwt.publicKeyPath) { _publicKey = fs.readFileSync(config.jwt.publicKeyPath, 'utf8'); }
    else if (config.jwt.publicKeyB64) { _publicKey = Buffer.from(config.jwt.publicKeyB64, 'base64').toString('utf8'); }
    else if (config.jwt.publicKey)    { _publicKey = config.jwt.publicKey.replace(/\\n/g, '\n'); }
    else throw new Error('No JWT public key configured');
    return _publicKey;
}

// The One True Verifier — RS256-only, canonical claims (sub/org_id/sid/jti),
// roles/permissions arrays. Verifies via JWKS when JWKS_URI is set, else the
// statically-provisioned public key.
const _canonical = createAuthMiddleware({
    jwksUri:         process.env.JWKS_URI || undefined,
    issuer:          config.jwt.issuer,
    audience:        config.jwt.audience,
    staticPublicKey: getPublicKey(),
});

// Translate auth-node's classified error into the service AppError envelope (keeps 401).
const authMiddleware = (req, res, next) =>
    _canonical(req, res, (err) =>
        err ? next(new AppError((err.code || 'unauthorized').toUpperCase(), err.message, err.status || 401)) : next());

// HMAC service-to-service auth (unchanged)
function internalAuth(req, _res, next) {
    if (!config.internalSecret) {
        if (process.env.NODE_ENV !== 'production') return next();
        return next(new AppError('CONFIGURATION_ERROR', 'Internal secret not set', 500));
    }
    const sig = req.headers['x-service-signature'];
    const ts  = req.headers['x-service-timestamp'];
    if (!sig || !ts) return next(new AppError('UNAUTHORIZED', 'Missing service auth', 401));
    if (Date.now() - parseInt(ts, 10) > 30_000) return next(new AppError('UNAUTHORIZED', 'Timestamp expired', 401));
    const expected = crypto.createHmac('sha256', config.internalSecret).update(`${ts}:${req.method}:${req.path}`).digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
        return next(new AppError('UNAUTHORIZED', 'Invalid service signature', 401));
    }
    next();
}

module.exports = { authMiddleware, internalAuth };
