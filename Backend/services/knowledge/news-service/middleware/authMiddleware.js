'use strict';
// Internal admin auth for /v1/admin/* — RS256-only verification via @baalvion/auth-node's
// One True Verifier, same canonical pattern as imperialpedia-service/middleware/authMiddleware.js.
// Distinct from middleware/apiKeyAuth.js, which gates the external developer-facing /v1/news API.
const {
    createAuthMiddleware,
    requireRole: rbacRequireRole,
} = require('@baalvion/auth-node');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');

const _canonical = createAuthMiddleware({
    jwksUri: config.jwt.jwksUri || undefined,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience,
    staticPublicKey: config.jwt.publicKey,
});

const toAppError = (err) => new AppError((err.code || 'unauthorized').toUpperCase(), err.message, err.status || 401);

const authMiddleware = (req, res, next) => _canonical(req, res, (err) => {
    if (err) return next(toAppError(err));
    req.user = { id: req.auth.userId, orgId: req.auth.orgId, roles: req.auth.roles };
    return next();
});

const wrap = (mw) => (req, res, next) => mw(req, res, (err) => (err ? next(toAppError(err)) : next()));
const requireRole = (...roles) => wrap(rbacRequireRole(...roles));

module.exports = { authMiddleware, requireRole };
