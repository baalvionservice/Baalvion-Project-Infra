'use strict';
const jwtServer = require('../utils/jwtserver');
const { AppError } = require('../utils/errors');
const authMiddleware = (req, res, next) => { try { const token = req.headers.authorization?.split(' ')[1]; if (!token) return next(new AppError('UNAUTHORIZED', 'No bearer token provided', 401)); const decoded = jwtServer.verifyAccessToken(token); req.auth = { userId: decoded.id, email: decoded.email, orgId: decoded.orgId, role: decoded.role || 'viewer', permissions: decoded.permissions || [], sessionId: decoded.sessionId }; req.user = { id: req.auth.userId, role: req.auth.role, orgId: req.auth.orgId }; return next(); } catch { return next(new AppError('UNAUTHORIZED', 'Invalid or expired token', 401)); } };
const requireRole = (...roles) => (req, res, next) => { if (!req.auth) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401)); if (!roles.includes(req.auth.role)) return next(new AppError('FORBIDDEN', 'Insufficient platform permissions', 403)); return next(); };
module.exports = { authMiddleware, requireRole };
