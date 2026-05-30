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
const _verifier = _canonical.verifier; // shared canonical verifier (RS256-only, canonical claims)

const toAppError = (err) => new AppError((err.code || 'unauthorized').toUpperCase(), err.message, err.status || 401);
const wrap = (mw) => (req, res, next) => mw(req, res, (err) => (err ? next(toAppError(err)) : next()));

const setUser = (req) => { req.user = { id: req.auth.userId, orgId: req.auth.orgId, roles: req.auth.roles }; };

// BFF cookie support: the auth-gateway stores the RS256 access JWT in the httpOnly
// `baalvion_access` cookie (host-scoped, so the browser sends it cross-port to this
// service with credentials:include). When no Authorization header is present, promote
// the cookie to a Bearer header so the canonical verifier authenticates it unchanged.
const COOKIE_ACCESS_NAME = process.env.COOKIE_ACCESS_NAME || 'baalvion_access';
const injectCookieToken = (req) => {
    if (!(req.headers && req.headers.authorization) && req.cookies && req.cookies[COOKIE_ACCESS_NAME]) {
        req.headers = req.headers || {};
        req.headers.authorization = 'Bearer ' + req.cookies[COOKIE_ACCESS_NAME];
    }
};

// Hard gate: rejects when no valid bearer token is present (header or BFF cookie).
const authMiddleware = (req, res, next) => {
    injectCookieToken(req);
    return _canonical(req, res, (err) => {
        if (err) return next(toAppError(err));
        setUser(req);
        return next();
    });
};

// Soft gate: populate canonical req.auth when a VALID canonical token is present;
// never rejects. Used on read routes that are anonymous but tenant/owner-scoped when signed in.
const optionalAuth = async (req, res, next) => {
    injectCookieToken(req);
    const header = (req.headers && req.headers.authorization) || '';
    if (!header.startsWith('Bearer ')) return next();
    try {
        const c = await _verifier.verify(header.slice(7).trim());
        const roles = Array.isArray(c.roles) ? c.roles : (c.role != null ? [c.role] : []);
        req.auth = {
            userId: c.sub, orgId: c.org_id, sessionId: c.sid,
            roles, permissions: Array.isArray(c.permissions) ? c.permissions : [],
            jti: c.jti, issuer: c.iss, audience: c.aud,
        };
        setUser(req);
    } catch { /* invalid/legacy/HS256 token on an optional route → anonymous */ }
    return next();
};

const requireRole = (...roles) => wrap(rbacRequireRole(...roles));
const requirePermission = (...perms) => wrap(rbacRequirePermission(...perms));

module.exports = { authMiddleware, optionalAuth, requireRole, requirePermission };
