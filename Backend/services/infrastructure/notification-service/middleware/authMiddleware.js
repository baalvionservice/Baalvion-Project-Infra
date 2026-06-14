'use strict';
// Canonical auth (Phase 3): RS256 verification via @baalvion/auth-node's One True
// Verifier (createAuthMiddleware). Local RSA key resolution + HMAC service auth stay here.
const fs     = require('fs');
const crypto = require('crypto');
const { createAuthMiddleware } = require('@baalvion/auth-node');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');
const { tryGetSdk } = require('../platform/sdk');

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

// Service-to-service auth — standardized on sdk.internalAuth (the platform's One
// internal-auth scheme; timing-safe). Verification logic lives in the SDK; this
// thin adapter maps the result onto the service AppError envelope (preserves 401).
// The direct-equality fallback covers the (practically unreachable) pre-init window.
function internalAuth(req, _res, next) {
    const sdk = tryGetSdk();
    const ok = sdk
        ? sdk.internalAuth.verify(req.headers)
        : timingSafeEqual(req.headers['x-internal-secret'], config.internalSecret);
    if (!ok) return next(new AppError('UNAUTHORIZED', 'Invalid or missing internal service credentials', 401));
    next();
}

function timingSafeEqual(provided, expected) {
    if (!provided || !expected) return false;
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ── DLQ / queue-admin guard ────────────────────────────────────────────────────
// Only platform admins or internal service callers may inspect/retry the DLQ.
// req.internal covers service-to-service paths (internalAuth sets it upstream);
// for JWT paths the caller must hold super_admin or admin role.
const ADMIN_ROLES = ['super_admin', 'admin'];

function requireAdmin(req, res, next) {
    if (!req.auth) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
    if (req.internal) return next();
    const roles = req.auth.roles || [];
    const perms = req.auth.permissions || [];
    const ok = roles.some((r) => ADMIN_ROLES.includes(r)) || perms.includes('*') || perms.includes('notifications:admin');
    return ok ? next() : next(new AppError('FORBIDDEN', 'Admin or super_admin role required', 403));
}

module.exports = { authMiddleware, internalAuth, requireAdmin };
