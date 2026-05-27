'use strict';
// Canonical auth (Phase 4 A4 cutover): RS256-only verification of auth-service tokens via
// @baalvion/auth-node. NO local issuer, NO HS256, NO legacy id/orgId coercion.
//
// IDENTITY RECONCILIATION: law's business tables (lawyers/clients/documents/cases/...) are keyed
// by the LOCAL legal.users id, but the canonical token's `sub` is auth.users.id. We map the two by
// EMAIL (a stable key preserved at import) and set req.user.id = the LEGAL id, so existing
// controller joins keep working unchanged. The canonical auth id stays available as req.auth.userId.
const {
    createJwksVerifier,
    requireRole: rbacRequireRole,
    requirePermission: rbacRequirePermission,
} = require('@baalvion/auth-node');
const config = require('../config/appConfig');
const db = require('../models');
const { AppError } = require('../utils/errors');

const verifier = createJwksVerifier({
    jwksUri:                  config.jwt.jwksUri || undefined,
    issuer:                   config.jwt.issuer,
    audience:                 config.jwt.audience,
    staticPublicKey:          config.jwt.publicKey,
    rejectHs256:              true,
    requiredClaims:           ['sub', 'org_id', 'sid', 'jti'],
    validateRolesPermissions: true,
});

const toAppError = (err) => new AppError((err.code || 'unauthorized').toUpperCase(), err.message || 'Invalid or expired token', err.status || 401);

const authMiddleware = async (req, res, next) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return next(new AppError('UNAUTHORIZED', 'No bearer token provided', 401));
    let claims;
    try {
        claims = await verifier.verify(header.slice(7).trim());
    } catch (err) {
        return next(toAppError(err));
    }
    const roles = Array.isArray(claims.roles) ? claims.roles : (claims.role != null ? [claims.role] : []);
    req.auth = {
        userId: claims.sub, orgId: claims.org_id ?? null, sessionId: claims.sid ?? null,
        roles, permissions: Array.isArray(claims.permissions) ? claims.permissions : [],
        jti: claims.jti, email: claims.email ?? null,
    };
    // Map canonical identity -> local legal.users by email; req.user.id = LEGAL id for joins.
    let legalId = null;
    try {
        if (req.auth.email) {
            const local = await db.User.findOne({ where: { email: req.auth.email }, attributes: ['id'] });
            legalId = local ? local.id : null;
        }
    } catch (_) { /* lookup failure -> null; law-specific endpoints handle absence */ }
    req.user = { id: legalId, orgId: req.auth.orgId, roles: req.auth.roles, email: req.auth.email };
    return next();
};

const wrap = (mw) => (req, res, next) => mw(req, res, (err) => (err ? next(toAppError(err)) : next()));
const requireRole = (...roles) => wrap(rbacRequireRole(...roles));
const requirePermission = (...perms) => wrap(rbacRequirePermission(...perms));

module.exports = { authMiddleware, requireRole, requirePermission };
