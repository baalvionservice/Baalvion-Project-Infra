'use strict';
// Canonical auth (Phase 3 Batch A): RS256-only verification via @baalvion/auth-node's
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

// Sets canonical req.auth; plus a back-compat req.user {id, orgId, roles} (NO scalar role)
// for controllers that read req.user.id / req.user.orgId.
const authMiddleware = (req, res, next) => _canonical(req, res, (err) => {
    if (err) return next(toAppError(err));
    req.user = { id: req.auth.userId, orgId: req.auth.orgId, roles: req.auth.roles };
    return next();
});

const wrap = (mw) => (req, res, next) => mw(req, res, (err) => (err ? next(toAppError(err)) : next()));
const requireRole = (...roles) => wrap(rbacRequireRole(...roles));
const requirePermission = (...perms) => wrap(rbacRequirePermission(...perms));

module.exports = { authMiddleware, requireRole, requirePermission };
