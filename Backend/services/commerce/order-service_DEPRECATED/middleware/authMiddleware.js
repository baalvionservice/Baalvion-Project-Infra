'use strict';
// Canonical auth (Phase 3): RS256-only verification via @baalvion/auth-node's One
// True Verifier. No local jwtserver, no legacy id/orgId/sessionId coercion.
const Redis = require('ioredis');
const {
    createAuthMiddleware,
    requireRole: rbacRequireRole,
    requirePermission: rbacRequirePermission,
} = require('@baalvion/auth-node');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');

// Canonical shared JTI revocation (auth:blacklist:<jti>): a token revoked at logout must be
// rejected at every resource service, not just the edge. The verifier checks the blacklist on
// each verify and FAILS CLOSED on a Redis outage (a revoked token can never slip through).
const _revocationRedis = new Redis({
    host: config.redis.host, port: config.redis.port,
    password: config.redis.password || undefined, lazyConnect: true,
});
_revocationRedis.on('error', (e) => console.error('[order-service auth blacklist]', e.message));

const _canonical = createAuthMiddleware({
    jwksUri:         config.jwt.jwksUri || undefined,
    issuer:          config.jwt.issuer,
    audience:        config.jwt.audience,
    staticPublicKey: config.jwt.publicKey,
    redis:           _revocationRedis,
});

// Map auth-node's classified errors into the service AppError (preserves 401/403 envelope).
const toAppError = (err) => new AppError((err.code || 'unauthorized').toUpperCase(), err.message, err.status || 401);
const wrap = (mw) => (req, res, next) => mw(req, res, (err) => (err ? next(toAppError(err)) : next()));

const authMiddleware = wrap(_canonical);
// Hierarchical RBAC (canonical roles[]); super_admin satisfies any check.
const requireRole = (...roles) => wrap(rbacRequireRole(...roles));
const requirePermission = (...perms) => wrap(rbacRequirePermission(...perms));

// Optional auth (guest-capable routes, e.g. carts): if an Authorization header is present it MUST
// be valid (a forged/expired token is still rejected 401); if absent, the request proceeds as a
// guest (req.auth undefined) and ownership is enforced via the signed cart session instead.
const optionalAuth = (req, res, next) => {
    const hasAuth = req.get && req.get('authorization');
    if (!hasAuth) return next();
    return authMiddleware(req, res, next);
};

module.exports = { authMiddleware, optionalAuth, requireRole, requirePermission };
