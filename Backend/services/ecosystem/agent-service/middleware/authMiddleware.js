'use strict';
const crypto = require('node:crypto');
const jwt = require('../config/jwt');
const config = require('../config/appConfig');
const { Errors } = require('../utils/errors');

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

/**
 * Constant-time comparison for the internal API key.
 * Guards against timing-oracle attacks; also rejects if either value is empty
 * (an unset key must never match an empty header, and vice-versa).
 */
function internalKeyMatch(candidate, expected) {
    if (!candidate || !expected) return false;
    // timingSafeEqual requires equal-length Buffers; length mismatch itself is not
    // secret information, but we still reject immediately rather than leaking it.
    const a = Buffer.from(candidate);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
}

const internalOrUser = (req, res, next) => {
    const key = req.headers['x-internal-key'];
    if (internalKeyMatch(key, config.internalApiKey)) {
        req.internal = true;
        req.auth = req.auth || { userId: 'service', roles: ['service'], permissions: [], orgId: null };
        return next();
    }
    return authenticate(req, res, next);
};

module.exports = { authenticate, internalOrUser };
