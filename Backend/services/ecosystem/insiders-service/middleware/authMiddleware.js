'use strict';
// Phase 6E-8 HARD STATE: gateway-only trust boundary.
// Bearer token verification permanently removed. No HS256 path. No fallback auth.
// All authentication flows through auth-gateway (RS256 BFF). No env var override.
// Rollback requires deployment revert (git revert / image rollback).
const { bffBridge } = require('./bffBridge');
const { ensureLocalIdentity } = require('./gatewayIdentity');
const { AppError } = require('../utils/errors');

const toAuth = (v) => ({
    userId:      v.userId,
    email:       v.email,
    roles:       v.roles,
    orgId:       v.orgId,
    sessionId:   v.sessionId,
    permissions: v.permissions,
    source:      v.source,
    algorithm:   v.algorithm,
});

// Single auth path: verified gateway identity only.
const decode = async (req) => {
    const bridged = bffBridge(req);
    if (!bridged) return null;
    if (bridged.reject) {
        const e = new AppError('UNAUTHORIZED', 'Untrusted gateway identity', 401);
        e._gateway = true;
        throw e;
    }
    return toAuth(bridged.identity);
};

// Hard gate: requires gateway-issued identity. Direct bearer tokens → 401.
const authMiddleware = async (req, res, next) => {
    try {
        const auth = await decode(req);
        if (!auth) return next(new AppError('GATEWAY_REQUIRED', 'Authentication via auth-gateway required; direct bearer tokens not accepted', 401));
        req.auth = auth;
        await ensureLocalIdentity(req); // map central gateway identity → local users.id (+ JIT provision)
        return next();
    } catch (e) {
        if (e._gateway) return next(new AppError('UNAUTHORIZED', 'Untrusted gateway identity', 401));
        return next(new AppError('UNAUTHORIZED', 'Authentication failed', 401));
    }
};

// Soft gate: gateway identity if present, anonymous otherwise. Bearer tokens ignored.
const optionalAuth = async (req, res, next) => {
    try {
        const auth = await decode(req);
        if (auth) { req.auth = auth; await ensureLocalIdentity(req); }
    } catch { /* anonymous on error */ }
    return next();
};

const requireRole = (...roles) => (req, res, next) => {
    if (!req.auth) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
    if (!req.auth.roles.some((r) => roles.includes(r))) {
        return next(new AppError('FORBIDDEN', 'You do not have permission for this action', 403));
    }
    return next();
};

module.exports = { authMiddleware, optionalAuth, requireRole };
