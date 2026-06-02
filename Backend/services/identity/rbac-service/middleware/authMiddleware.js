'use strict';
const jwt = require('../config/jwt');
const config = require('../config/appConfig');
const { Errors } = require('../utils/errors');

/**
 * Verifies the canonical access token and populates req.auth. Token verification
 * is delegated to @baalvion/auth-node (the single permitted JWT authority).
 *
 * req.auth carries the canonical contract: { userId, orgId, roles[], permissions[],
 * sessionId, jti }. These are the token's CLAIMED roles (the platform hierarchy
 * viewer..super_admin); the rbac-service's OWN scoped roles are resolved from the
 * database by authzService — the two are bridged, never conflated.
 */
const authenticate = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return next(Errors.unauthorized('Bearer token required'));
    }
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
    } catch (err) {
        return next(Errors.unauthorized('Invalid or expired token'));
    }
};

/**
 * Service-to-service entry for PEPs (other backends) calling the decision API.
 * If INTERNAL_API_KEY is configured and the X-Internal-Key header matches, the
 * caller is trusted as a service principal. Falls through to user auth otherwise.
 */
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
