'use strict';
// Canonical auth (Phase 3 Batch B): RS256-only verification via @baalvion/auth-node's
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
// Ownership-or-admin checks in controllers read req.auth.roles (see RBAC.md).
const authMiddleware = (req, res, next) => _canonical(req, res, (err) => {
    if (err) return next(toAppError(err));
    req.user = { id: req.auth.userId, orgId: req.auth.orgId, roles: req.auth.roles };
    return next();
});

// Optional auth for public-read routes: if a valid Bearer is present, populate req.auth/req.user
// (so an admin sees elevated data, e.g. unpublished terms); if absent or invalid, continue anonymously.
const optionalAuth = (req, res, next) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return next();
    return _canonical(req, res, (err) => {
        if (err) {
            // Bad/expired token on a public route → treat as anonymous. Null out any partially
            // populated auth state so a rejected token can never leak roles downstream.
            req.auth = undefined;
            req.user = undefined;
            return next();
        }
        req.user = { id: req.auth.userId, orgId: req.auth.orgId, roles: req.auth.roles };
        return next();
    });
};

const wrap = (mw) => (req, res, next) => mw(req, res, (err) => (err ? next(toAppError(err)) : next()));
const requireRole = (...roles) => wrap(rbacRequireRole(...roles));
const requirePermission = (...perms) => wrap(rbacRequirePermission(...perms));

module.exports = { authMiddleware, optionalAuth, requireRole, requirePermission };
