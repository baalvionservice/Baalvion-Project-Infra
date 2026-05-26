'use strict';
const { verifyToken }  = require('../utils/jwtVerify');
const { AppError }     = require('../utils/errors');
const redis            = require('../config/redis');

async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return next(new AppError('UNAUTHORIZED', 'Bearer token required', 401));
    }

    const token = authHeader.slice(7);
    try {
        const decoded = verifyToken(token);

        // JTI blacklist check
        if (decoded.jti && redis.isAvailable()) {
            const blacklisted = await redis.getClient()?.get(`auth:bl:${decoded.jti}`);
            if (blacklisted) return next(new AppError('TOKEN_BLACKLISTED', 'Token has been revoked', 401));
        }

        req.auth = {
            userId:     decoded.sub,
            email:      decoded.email,
            orgId:      decoded.org_id ?? null,
            role:       decoded.role,
            permissions: decoded.permissions ?? [],
            sessionId:  decoded.sid,
            jti:        decoded.jti,
            isImpersonation: !!decoded.impersonated_by,
            impersonatedBy:  decoded.impersonated_by,
        };
        next();
    } catch (err) {
        next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401));
    }
}

function requireRole(...roles) {
    const HIERARCHY = ['viewer', 'member', 'editor', 'manager', 'admin', 'owner', 'super_admin'];
    return (req, res, next) => {
        if (!req.auth) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
        const userLevel = HIERARCHY.indexOf(req.auth.role);
        const allowed   = roles.some(r => userLevel >= HIERARCHY.indexOf(r));
        if (!allowed) return next(new AppError('FORBIDDEN', `Requires role: ${roles.join(' or ')}`, 403));
        next();
    };
}

const requireSuperAdmin = requireRole('super_admin');
const requireOrgAdmin   = requireRole('admin', 'owner', 'super_admin');

module.exports = { authMiddleware, requireRole, requireSuperAdmin, requireOrgAdmin };
