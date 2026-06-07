'use strict';
// Canonical auth (Phase 3 Batch C): RS256-only verification via @baalvion/auth-node's
// One True Verifier. No local jwtserver, no legacy id/orgId/sessionId coercion.
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

// Canonical req.auth; back-compat req.user {id, orgId, roles} (no scalar role).
// Controllers read req.auth.roles for authorization (see RBAC.md).
const authMiddleware = (req, res, next) => _canonical(req, res, (err) => {
    if (err) return next(toAppError(err));
    req.user = { id: req.auth.userId, orgId: req.auth.orgId, roles: req.auth.roles };
    return next();
});

// Optional auth for public-read endpoints that also back an authenticated admin view.
// When a valid Bearer token is present we attach req.user (so controllers scope to the
// caller's org and can return all statuses); with no/invalid token we proceed as the
// anonymous public path (default org, published-only) instead of rejecting.
const optionalAuth = (req, res, next) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return next();
    return _canonical(req, res, (err) => {
        if (!err && req.auth) {
            req.user = { id: req.auth.userId, orgId: req.auth.orgId, roles: req.auth.roles };
        }
        return next();
    });
};

const wrap = (mw) => (req, res, next) => mw(req, res, (err) => (err ? next(toAppError(err)) : next()));
const requireRole = (...roles) => wrap(rbacRequireRole(...roles));
const requirePermission = (...perms) => wrap(rbacRequirePermission(...perms));

module.exports = { authMiddleware, optionalAuth, requireRole, requirePermission };
