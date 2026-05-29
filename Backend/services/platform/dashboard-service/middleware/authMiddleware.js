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
const gatewayTrust = require('./gatewayTrust');

const _canonical = createAuthMiddleware({
    jwksUri:         config.jwt.jwksUri || undefined,
    issuer:          config.jwt.issuer,
    audience:        config.jwt.audience,
    staticPublicKey: config.jwt.publicKey,
});

// BFF gateway path: in strict mode the gateway fronts us and sends HMAC-signed identity headers
// instead of a Bearer. Verify + trust them when present (required:false so direct Bearer callers
// still fall through to the canonical RS256 verifier). No-op if no signing secret is configured.
const _gatewayTrust = process.env.GATEWAY_SIGNING_SECRET
    ? gatewayTrust({ secret: process.env.GATEWAY_SIGNING_SECRET, required: false })
    : (req, res, next) => next();

const toAppError = (err) => new AppError((err.code || 'unauthorized').toUpperCase(), err.message, err.status || 401);

const setBackCompatUser = (req) => {
    if (!req.auth.permissions) req.auth.permissions = [];
    req.user = {
        id: req.auth.userId, orgId: req.auth.orgId,
        roles: req.auth.roles, role: (req.auth.roles || [])[0] ?? null,
    };
};

// Canonical req.auth; back-compat req.user {id, orgId, roles}. Tries the trusted gateway identity
// first, then a direct Bearer. `role` is PRIMARY role for audit metadata only — not an auth gate.
const authMiddleware = (req, res, next) => _gatewayTrust(req, res, (gErr) => {
    if (gErr) return next(gErr);
    if (req.auth && req.auth.source === 'gateway') { setBackCompatUser(req); return next(); }
    return _canonical(req, res, (err) => {
        if (err) return next(toAppError(err));
        setBackCompatUser(req);
        return next();
    });
});

const wrap = (mw) => (req, res, next) => mw(req, res, (err) => (err ? next(toAppError(err)) : next()));
const requireRole = (...roles) => wrap(rbacRequireRole(...roles));
const requirePermission = (...perms) => wrap(rbacRequirePermission(...perms));

module.exports = { authMiddleware, requireRole, requirePermission };
