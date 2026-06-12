'use strict';
const jwt   = require('../utils/jwtRsa');
const redis = require('../config/redis');
const { AppError } = require('../utils/errors');

const authMiddleware = async (req, res, next) => {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer ')) {
            return next(new AppError('UNAUTHORIZED', 'Bearer token required', 401));
        }

        const token   = header.slice(7);
        const decoded = jwt.verifyAccessToken(token);

        // Reject blacklisted tokens (issued before logout)
        if (decoded.jti && await redis.isTokenBlacklisted(decoded.jti)) {
            return next(new AppError('UNAUTHORIZED', 'Token has been revoked', 401));
        }

        req.auth = {
            userId:      decoded.sub,
            email:       decoded.email,
            orgId:       decoded.org_id,
            role:        decoded.role        || 'viewer',
            permissions: decoded.permissions || [],
            sessionId:   decoded.sid,
            jti:         decoded.jti,
        };
        req.user = { id: req.auth.userId, role: req.auth.role, orgId: req.auth.orgId };

        // Tenant kill-switch: reject in-flight access tokens bound to a suspended org.
        if (req.auth.orgId && await redis.isOrgSuspended(req.auth.orgId)) {
            return next(new AppError('ORG_SUSPENDED', 'Organization is suspended', 403));
        }
        return next();
    } catch {
        return next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401));
    }
};

const requireRole = (...roles) => (req, res, next) => {
    if (!req.auth) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
    if (!roles.includes(req.auth.role)) {
        return next(new AppError('FORBIDDEN', `Role '${req.auth.role}' is not authorized`, 403));
    }
    return next();
};

module.exports = { authMiddleware, requireRole };
