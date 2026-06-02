'use strict';
const crypto = require('crypto');
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

/**
 * Constant-time comparison for the X-Internal-Key header.
 * A plain === comparison leaks the secret length via timing differences, and
 * short-circuits on the first differing byte. timingSafeEqual requires equal-
 * length buffers, so we check byte-length first (which is itself safe: knowing
 * the secret's byte-length is a negligible hint given a proper random secret).
 */
function internalKeyMatches(provided) {
    const expected = config.internalApiKey;
    if (!expected || !provided) return false;
    const a = Buffer.from(provided, 'utf8');
    const b = Buffer.from(expected, 'utf8');
    if (a.byteLength !== b.byteLength) return false;
    return crypto.timingSafeEqual(a, b);
}

// Service-to-service write auth: a trusted PEP presents X-Internal-Key. Falls back
// to user auth when no internal key is configured/sent.
const internalOrUser = (req, res, next) => {
    const key = req.headers['x-internal-key'];
    if (internalKeyMatches(key)) {
        req.internal = true;
        req.auth = req.auth || { userId: 'service', roles: ['service'], permissions: [], orgId: null };
        return next();
    }
    return authenticate(req, res, next);
};

module.exports = { authenticate, internalOrUser };
