'use strict';
const jwt = require('../config/jwt');
const config = require('../config/appConfig');
const { Errors } = require('../utils/errors');

// User/admin auth — verifies the canonical RS256 token, populates req.auth.
const authenticate = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return next(Errors.unauthorized('Bearer token required'));
    try {
        const c = jwt.verifyAccessToken(header.slice(7).trim());
        const roles = Array.isArray(c.roles) ? c.roles : (c.role != null ? [c.role] : []);
        req.auth = {
            userId:      String(c.userId ?? c.sub),
            email:       c.email || null,
            orgId:       c.org_id ?? c.organizationId ?? null,
            roles,
            permissions: Array.isArray(c.permissions) ? c.permissions : [],
            sessionId:   c.sid ?? c.sessionId ?? null,
            jti:         c.jti || null,
        };
        return next();
    } catch {
        return next(Errors.unauthorized('Invalid or expired token'));
    }
};

// Service-to-service write auth: a trusted PEP presents X-Internal-Key. Falls back
// to user auth when no internal key is configured/sent.
const internalOrUser = (req, res, next) => {
    const key = req.headers['x-internal-key'];
    if (config.internalApiKey && key && key === config.internalApiKey) {
        req.internal = true;
        req.auth = req.auth || { userId: 'service', roles: ['service'], permissions: [], orgId: null };
        return next();
    }
    return authenticate(req, res, next);
};

module.exports = { authenticate, internalOrUser };
