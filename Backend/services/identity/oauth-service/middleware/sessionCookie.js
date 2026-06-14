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

    // Honor logout/revocation via the canonical jti blacklist (auth:blacklist:<jti>) the Bearer
    // path checks. Fail CLOSED: a jti that cannot be checked against the store is rejected,
    // mirroring authMiddleware — a revoked SSO cookie must never resolve to an active session.
    if (decoded.jti) {
        try {
            const client = redis.getClient();
            if (!client || !redis.isAvailable()) throw new Error('revocation store unavailable');
            const blacklisted = await client.get(`auth:blacklist:${decoded.jti}`);
            if (blacklisted) return null;
        } catch {
            return null;
        }
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
