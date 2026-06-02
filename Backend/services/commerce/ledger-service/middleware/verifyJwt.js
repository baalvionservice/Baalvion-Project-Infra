'use strict';
/**
 * Dependency-free RS256 JWT verification (Node crypto only).
 *
 * ledger-service has no JWT library in its dependency set, so rather than pull
 * one in (and require a workspace reinstall) we verify the platform's RS256
 * access tokens directly against the public key. This replaces the previous
 * middleware that accepted ANY bearer string — a full authentication bypass.
 *
 * Verifies: RS256 signature against JWT_PUBLIC_KEY, exp/nbf, and (only when the
 * corresponding env is set) issuer/audience. The 'none' algorithm and any HS*
 * (symmetric) token are rejected outright.
 */
const crypto = require('crypto');

const PUBLIC_KEY = (process.env.JWT_PUBLIC_KEY || '').replace(/\\n/g, '\n');

function authError(code, message, statusCode = 401) {
    return Object.assign(new Error(message), { code, statusCode });
}

function b64urlToBuf(s) {
    return Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}
function decodeSegment(s) {
    return JSON.parse(b64urlToBuf(s).toString('utf8'));
}

/** Verify an RS256 token → its claims, or throw an auth error. */
function verify(token) {
    if (!PUBLIC_KEY) throw authError('AUTH_NOT_CONFIGURED', 'JWT_PUBLIC_KEY is not configured', 500);
    const parts = String(token || '').split('.');
    if (parts.length !== 3) throw authError('INVALID_TOKEN', 'Malformed token');

    const [h, p, sig] = parts;
    let header, payload;
    try { header = decodeSegment(h); payload = decodeSegment(p); }
    catch { throw authError('INVALID_TOKEN', 'Unparseable token'); }

    if (header.alg !== 'RS256') throw authError('INVALID_TOKEN', `Unsupported algorithm: ${header.alg}`); // reject none / HS*

    const ok = crypto.verify('RSA-SHA256', Buffer.from(`${h}.${p}`), PUBLIC_KEY, b64urlToBuf(sig));
    if (!ok) throw authError('INVALID_TOKEN', 'Signature verification failed');

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && now >= payload.exp) throw authError('TOKEN_EXPIRED', 'Token has expired');
    if (payload.nbf && now < payload.nbf) throw authError('INVALID_TOKEN', 'Token is not yet valid');

    const wantIss = process.env.JWT_ISSUER;
    if (wantIss && payload.iss !== wantIss) throw authError('INVALID_TOKEN', 'Invalid token issuer');
    const wantAud = process.env.JWT_AUDIENCE;
    if (wantAud) {
        // When an audience is configured it MUST be present and match. A token with no
        // aud claim is also rejected — omitting aud is not a bypass (RFC 7519 §4.1.3).
        if (payload.aud == null || ![].concat(payload.aud).includes(wantAud)) {
            throw authError('INVALID_TOKEN', 'Invalid token audience');
        }
    }
    return payload;
}

module.exports = { verify };
