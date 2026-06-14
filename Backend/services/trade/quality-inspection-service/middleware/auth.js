'use strict';
/**
 * RS256-only authentication (R2). Two accepted identity sources, in priority order:
 *   1. auth-gateway BFF identity (HMAC-signed headers) — preferred trust boundary.
 *   2. RS256 bearer verified against the issuer JWKS (no HS256, ever).
 * There is NO HS256 path. Refresh tokens are not handled here.
 */
const crypto = require('crypto');
const { createJwksVerifier } = require('@baalvion/auth-node');
const config = require('../config/appConfig');
const { AppError } = require('../utils/errors');

const gatewaySecret = () => process.env.GATEWAY_SIGNING_SECRET || '';

function verifyGatewayIdentity(headers) {
    const sec = gatewaySecret();
    if (!sec) return null;
    const userId = headers['x-user-id'];
    const orgId = headers['x-org-id'] || '';
    let roles = [];
    try { roles = JSON.parse(headers['x-roles'] || '[]'); } catch { /* [] */ }
    const sig = headers['x-gateway-signature'] || '';
    if (!userId || !sig) return null;
    const expected = crypto.createHmac('sha256', sec).update(`${userId}.${orgId}.${roles.join(',')}`).digest('hex');
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return { userId, orgId: orgId || null, roles, sessionId: headers['x-session-id'] || null, source: 'gateway' };
}

const verifier = createJwksVerifier({
    jwksUri: process.env.JWKS_URI || 'http://localhost:3001/.well-known/jwks.json',
    issuer: process.env.JWT_ISSUER || undefined,
    audience: process.env.JWT_AUDIENCE || undefined,
    rejectHs256: true,
    requiredClaims: ['sub', 'org_id', 'jti'],
    validateRolesPermissions: true,
});

function toAuth(id) {
    return {
        userId: id.userId,
        orgId: id.orgId ?? null,
        tenantId: id.orgId ?? null,
        roles: id.roles || [],
        role: (id.roles && id.roles[0]) || 'client',
        permissions: id.permissions || [],
        source: id.source,
    };
}

const authMiddleware = async (req, res, next) => {
    try {
        const gw = verifyGatewayIdentity(req.headers);
        if (gw) { req.auth = toAuth(gw); return next(); }
        const header = req.headers.authorization || '';
        if (!header.startsWith('Bearer ')) return next(new AppError('UNAUTHORIZED', 'Bearer token or gateway identity required', 401));
        const c = await verifier.verify(header.slice(7).trim());
        req.auth = toAuth({ userId: c.sub, orgId: c.org_id, roles: Array.isArray(c.roles) ? c.roles : [], permissions: c.permissions, source: 'bearer' });
        return next();
    } catch (err) {
        return next(new AppError(err.code || 'INVALID_TOKEN', err.message || 'Invalid or expired token', 401));
    }
};

const requireRole = (...roles) => (req, res, next) => {
    if (!req.auth) return next(new AppError('UNAUTHORIZED', 'Authentication required', 401));
    if (!req.auth.roles.some((r) => roles.includes(r))) {
        return next(new AppError('FORBIDDEN', `Not authorized (requires one of: ${roles.join(', ')})`, 403));
    }
    return next();
};

module.exports = { authMiddleware, requireRole, verifier };
