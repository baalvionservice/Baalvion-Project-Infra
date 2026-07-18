'use strict';
// Canonical auth: RS256-only verification via @baalvion/auth-node's One True Verifier.
// jwt.decode() below reads the email claim ONLY (never verifies) — verification already
// happened via createAuthMiddleware above it. Same carve-out as community-service's
// authMiddleware.js (see Backend/catalog/enforce.mjs's JWT_ALLOWLIST).
const { createAuthMiddleware } = require('@baalvion/auth-node');
const jwt = require('jsonwebtoken');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');

const _canonical = createAuthMiddleware({
    jwksUri:         config.jwt.jwksUri || undefined,
    issuer:          config.jwt.issuer,
    audience:        config.jwt.audience,
    staticPublicKey: config.jwt.publicKey,
});

const toAppError = (err) => new AppError((err.code || 'unauthorized').toUpperCase(), err.message, err.status || 401);

const authMiddleware = (req, res, next) => _canonical(req, res, (err) => {
    if (err) return next(toAppError(err));
    return next();
});

const PLATFORM_ADMIN_ROLES = new Set(['super_admin', 'platform_admin']);

const requirePlatformAdmin = (req, res, next) => {
    const roles = Array.isArray(req.auth && req.auth.roles) ? req.auth.roles : [];
    const isAdmin = roles.some((r) => PLATFORM_ADMIN_ROLES.has(String(r).toLowerCase()));
    if (isAdmin) return next();
    return next(new AppError('FORBIDDEN', 'Platform admin required', 403));
};

function decodeEmailFromRequest(req) {
    try {
        const tok = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
        return (jwt.decode(tok) || {}).email || null;
    } catch {
        return null;
    }
}

module.exports = { authMiddleware, requirePlatformAdmin, decodeEmailFromRequest };
