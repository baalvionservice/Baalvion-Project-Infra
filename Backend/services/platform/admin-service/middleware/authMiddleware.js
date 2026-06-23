'use strict';
// Canonical auth (Phase 3 Batch C): RS256 verification via @baalvion/auth-node's
// One True Verifier (createAuthMiddleware). No handwritten verify, no legacy
// id/orgId/sessionId coercion, no scalar-role gate. JTI revocation preserved.
const fs = require('fs');
const {
    createAuthMiddleware,
    requireRole:       rbacRequireRole,
    requirePermission: rbacRequirePermission,
    requireSuperAdmin: rbacRequireSuperAdmin,
    requireOrgAdmin:   rbacRequireOrgAdmin,
} = require('@baalvion/auth-node');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const redis = require('../config/redis');

function resolveStaticPublicKey() {
    if (config.jwt.publicKeyPath) {
        try {
            return fs.readFileSync(config.jwt.publicKeyPath, 'utf8');
        } catch (err) {
            // Non-fatal: fall through to inline-key / B64 / JWKS sources below.
            logger.warn({ err: err.message, path: config.jwt.publicKeyPath }, '[auth] could not read JWT_PUBLIC_KEY_PATH; falling back to other key sources');
        }
    }
    if (config.jwt.publicKey) return config.jwt.publicKey.replace(/\\n/g, '\n');
    return undefined;
}

const _canonical = createAuthMiddleware({
    jwksUri:            config.jwt.jwksUri || undefined,
    issuer:             config.jwt.issuer,
    audience:           config.jwt.audience,
    staticPublicKey:    resolveStaticPublicKey(),
    staticPublicKeyB64: config.jwt.publicKeyB64 || undefined,
    // JTI revocation check. Fail-OPEN only when Redis is unavailable (preserves the
    // prior behaviour); a present-but-throwing lookup fails CLOSED inside auth-node.
    isBlacklisted: async (jti) => {
        if (!(redis.isAvailable && redis.isAvailable())) return false;
        const bl = await redis.getClient()?.get(`auth:blacklist:${jti}`); // Phase 9: canonical shared namespace
        return !!bl;
    },
});

const toAppError = (err) => new AppError((err.code || 'unauthorized').toUpperCase(), err.message, err.status || 401);

// Canonical req.auth {userId, orgId, sessionId, roles[], permissions[], jti};
// back-compat req.user {id, orgId, roles} (no scalar role).
const authMiddleware = (req, res, next) => _canonical(req, res, (err) => {
    if (err) return next(toAppError(err));
    req.user = { id: req.auth.userId, orgId: req.auth.orgId, roles: req.auth.roles };
    return next();
});

const wrap = (mw) => (req, res, next) => mw(req, res, (err) => (err ? next(toAppError(err)) : next()));
const requireRole       = (...roles) => wrap(rbacRequireRole(...roles));
const requirePermission = (...perms) => wrap(rbacRequirePermission(...perms));
const requireSuperAdmin = wrap(rbacRequireSuperAdmin);
const requireOrgAdmin   = wrap(rbacRequireOrgAdmin);

module.exports = { authMiddleware, requireRole, requirePermission, requireSuperAdmin, requireOrgAdmin };
