'use strict';
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { loadKeys } = require('../config/vault');
const config  = require('../config/appConfig');

// ── Token signing ──────────────────────────────────────────────────────────────

/**
 * Signs an RS256 access token.
 * Payload must include: { sub, email, orgId, role, permissions, sid }
 */
function signAccessToken(payload) {
    const { privateKey, kid } = loadKeys();
    const { sub, email, orgId, role, permissions, sid, ...rest } = payload;
    return jwt.sign(
        {
            jti: uuidv4(),
            sub: String(sub),
            email,
            org_id: orgId,
            role,
            permissions: permissions || [],
            sid,
            ...rest,
        },
        privateKey,
        {
            algorithm: 'RS256',
            expiresIn: config.jwt.accessExpiresIn,
            issuer:    config.jwt.issuer,
            audience:  config.jwt.audience,
            keyid:     kid,
        }
    );
}

/**
 * Signs an RS256 refresh token.
 * Payload must include: { sub, sid, familyId }
 */
function signRefreshToken(payload) {
    const { privateKey, kid } = loadKeys();
    const { sub, sid, familyId, ...rest } = payload;
    return jwt.sign(
        {
            jti:       uuidv4(),
            sub:       String(sub),
            sid,
            family_id: familyId,
            ...rest,
        },
        privateKey,
        {
            algorithm: 'RS256',
            expiresIn: config.jwt.refreshExpiresIn,
            issuer:    config.jwt.issuer,
            keyid:     kid,
        }
    );
}

// ── Token verification ─────────────────────────────────────────────────────────

function verifyAccessToken(token) {
    const { publicKey } = loadKeys();
    return jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        issuer:     config.jwt.issuer,
        audience:   config.jwt.audience,
    });
}

function verifyRefreshToken(token) {
    const { publicKey } = loadKeys();
    return jwt.verify(token, publicKey, {
        algorithms: ['RS256'],
        issuer:     config.jwt.issuer,
    });
}

/** Decode without signature check — used only to extract claims for error paths. */
function decodeUnsafe(token) {
    return jwt.decode(token);
}

// ── JWKS ───────────────────────────────────────────────────────────────────────

let _jwksCache = null;

function getJwks() {
    if (_jwksCache) return _jwksCache;
    const { publicKey, kid } = loadKeys();
    const pubObj = crypto.createPublicKey(publicKey);
    const jwk    = pubObj.export({ format: 'jwk' });
    _jwksCache = {
        keys: [{
            kty: 'RSA',
            use: 'sig',
            alg: 'RS256',
            kid,
            n:   jwk.n,
            e:   jwk.e,
        }],
    };
    return _jwksCache;
}

/** Invalidate cache on key rotation. */
function clearJwksCache() { _jwksCache = null; }

// ── Helpers ────────────────────────────────────────────────────────────────────

/** SHA-256 hash of the raw token string — used as DB storage key. */
function hashToken(raw) {
    return crypto.createHash('sha256').update(raw).digest('hex');
}

module.exports = {
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    decodeUnsafe,
    getJwks,
    clearJwksCache,
    hashToken,
};
