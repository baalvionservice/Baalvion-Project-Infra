'use strict';
const jwt    = require('jsonwebtoken');
const { getPublicKey } = require('../utils/keys');
const config = require('../config/appConfig');
const redis  = require('../config/redis');

/**
 * Resolve identity from the hub's first-party HttpOnly `access_token` cookie.
 *
 * Browser SSO redirects to /authorize carry NO Authorization header, so the Bearer
 * authMiddleware can't see the user. But the browser DOES send the hub session cookie
 * (the auth-service-issued RS256 access token, set by auth-gateway). oauth-service shares
 * auth-service's key pair, so it can verify that token locally — this is what makes silent
 * cross-domain SSO possible.
 *
 * Returns a req.auth-shaped object, or null. NEVER throws — callers fall through to login.
 */
async function resolveSessionFromCookie(req) {
    const token = req.cookies && req.cookies[config.session.cookieName];
    if (!token) return null;

    let decoded;
    try {
        decoded = jwt.verify(token, getPublicKey(), {
            algorithms: ['RS256'],
            issuer:     config.jwt.issuer,
            audience:   config.session.audience,
        });
    } catch {
        return null; // tampered / expired / wrong issuer-audience → not authenticated
    }

    // Honor logout/revocation via the same jti blacklist the Bearer path checks.
    try {
        if (decoded.jti && redis.isAvailable()) {
            const blacklisted = await redis.getClient()?.get(`auth:bl:${decoded.jti}`);
            if (blacklisted) return null;
        }
    } catch {
        // Redis unavailable → blacklist not enforceable; the token is still validly signed and
        // unexpired (short-lived). Mirror authMiddleware, which also skips when Redis is down.
    }

    return {
        userId:    decoded.sub,
        orgId:     decoded.org_id ?? null,
        role:      decoded.role,
        scope:     decoded.scope || '',
        sessionId: decoded.sid,
        jti:       decoded.jti,
        exp:       decoded.exp,
        source:    'cookie',
    };
}

module.exports = { resolveSessionFromCookie };
