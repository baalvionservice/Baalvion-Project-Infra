'use strict';
const jwtServer = require('../utils/jwtserver');
const { AppError } = require('../utils/errors');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return next(new AppError('UNAUTHORIZED', 'No bearer token provided', 401));
        const decoded = jwtServer.verifyAccessToken(token);
        req.auth = {
            userId: decoded.id ?? decoded.sub,
            email:  decoded.email,
            orgId:  decoded.orgId ?? decoded.org_id,
            role:   decoded.role || 'candidate',
            permissions: decoded.permissions || [],
        };
        req.user = { id: req.auth.userId, role: req.auth.role, orgId: req.auth.orgId };
        return next();
    } catch {
        return next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401));
    }
};

const optionalAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next();
    try {
        const decoded = jwtServer.verifyAccessToken(token);
        req.auth  = { userId: decoded.id ?? decoded.sub, email: decoded.email, orgId: decoded.orgId ?? decoded.org_id, role: decoded.role || 'candidate', permissions: decoded.permissions || [] };
        req.user  = { id: req.auth.userId, role: req.auth.role };
    } catch { /* ignore */ }
    return next();
};

module.exports = { authMiddleware, optionalAuth };
