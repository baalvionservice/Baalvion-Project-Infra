'use strict';
/**
 * Authentication for the ledger API.
 *
 * Two trusted callers:
 *   1. Services (e.g. order-service posting payment journal entries) authenticate
 *      with a shared internal key in `X-Internal-Key` (constant-time compared).
 *      Enabled only when LEDGER_INTERNAL_KEY is configured.
 *   2. Users / admin tooling present an RS256 bearer token, verified against the
 *      platform public key (verifyJwt). The 'none' algorithm and HS* tokens are
 *      rejected.
 *
 * Fail-closed: a request with neither a matching internal key nor a valid token
 * is rejected 401. (Previously this middleware accepted ANY bearer string —
 * a complete authentication bypass; that mock is removed.)
 */
const crypto = require('crypto');
const { verify } = require('./verifyJwt');

const INTERNAL_KEY = process.env.LEDGER_INTERNAL_KEY || '';

function safeEqual(a, b) {
    const ba = Buffer.from(String(a || ''), 'utf8');
    const bb = Buffer.from(String(b || ''), 'utf8');
    if (ba.length !== bb.length || ba.length === 0) return false;
    return crypto.timingSafeEqual(ba, bb);
}

async function authMiddleware(req, res, next) {
    // Service-to-service via internal key (only when configured).
    const provided = req.headers['x-internal-key'];
    if (INTERNAL_KEY && provided && safeEqual(provided, INTERNAL_KEY)) {
        req.user = {
            sub: `svc:${req.headers['x-service-name'] || 'internal'}`,
            tenantId: req.headers['x-tenant-id'],
            roles: ['SERVICE'],
            isService: true,
        };
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing or invalid Authorization header' });
    }

    try {
        const claims = verify(authHeader.slice('Bearer '.length));

        // Tenant MUST come from the verified token claims — never from a client-supplied
        // header. If the caller also sends x-tenant-id we allow it only when it matches
        // the verified claim exactly; a mismatch is rejected to prevent tenant-hopping.
        const claimTenant = claims.orgId || claims.tenantId || null;
        const headerTenant = req.headers['x-tenant-id'];
        if (headerTenant && claimTenant && headerTenant !== claimTenant) {
            return res.status(403).json({
                error: 'TENANT_MISMATCH',
                message: 'x-tenant-id header does not match token claims',
            });
        }

        req.user = {
            sub: claims.sub,
            tenantId: claimTenant,   // authoritative: from verified token only
            roles: claims.roles || [],
            claims,
        };
        return next();
    } catch (err) {
        return res.status(err.statusCode || 401).json({ error: err.code || 'INVALID_TOKEN', message: err.message });
    }
}

module.exports = authMiddleware;
