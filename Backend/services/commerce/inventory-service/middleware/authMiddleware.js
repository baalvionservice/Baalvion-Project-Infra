'use strict';
// Canonical auth (Phase 3): RS256-only verification via @baalvion/auth-node's One
// True Verifier. No local jwtserver, no legacy id/orgId/sessionId coercion.
const {
    createAuthMiddleware,
    requireRole: rbacRequireRole,
    requirePermission: rbacRequirePermission,
} = require('@baalvion/auth-node');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');

const _canonical = createAuthMiddleware({
    jwksUri:         config.jwt.jwksUri || undefined,
    issuer:          config.jwt.issuer,
    audience:        config.jwt.audience,
    staticPublicKey: config.jwt.publicKey,
});

const toAppError = (err) => new AppError((err.code || 'unauthorized').toUpperCase(), err.message, err.status || 401);
const wrap = (mw) => (req, res, next) => mw(req, res, (err) => (err ? next(toAppError(err)) : next()));

const authMiddleware = wrap(_canonical);
const requireRole = (...roles) => wrap(rbacRequireRole(...roles));
const requirePermission = (...perms) => wrap(rbacRequirePermission(...perms));

// Optional auth (guest-capable storefront routes, e.g. stock lookups and checkout holds): if an
// Authorization header is present it MUST be valid (a forged/expired token is still rejected 401);
// if absent, the request proceeds as a guest (req.auth undefined). A short reservation TTL bounds
// guest abuse, and the global IP rate limit applies to every route regardless.
const optionalAuth = (req, res, next) => {
    const hasAuth = req.get && req.get('authorization');
    if (!hasAuth) return next();
    return authMiddleware(req, res, next);
};

module.exports = { authMiddleware, optionalAuth, requireRole, requirePermission };
