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
    const { sub, email, orgId, role, roles, permissions, sid, ...rest } = payload;

    // ── Canonical claim contract enforcement (Phase 2) ──────────────────────────
    // The issuer refuses to mint a malformed token: sub is required, roles and
    // permissions MUST be arrays. `role` (scalar) is accepted as input but only
    // re-emitted as a DEPRECATED one-phase compatibility alias.
    if (sub === undefined || sub === null || String(sub) === '') {
        throw new Error('[jwtRsa] refusing to sign: missing required claim "sub"');
    }
    const roleList = Array.isArray(roles) ? roles : (role != null ? [role] : []);
    if (!Array.isArray(roleList)) {
        throw new Error('[jwtRsa] refusing to sign: "roles" must be an array');
    }
    const permList = permissions === undefined ? [] : permissions;
    if (!Array.isArray(permList)) {
        throw new Error('[jwtRsa] refusing to sign: "permissions" must be an array');
    }

    return jwt.sign(
        {
            jti: uuidv4(),
            sub: String(sub),
            email,
            org_id: orgId ?? null,
            sid:    sid ?? null,
            roles:  roleList,
            role:   roleList[0] ?? null,   // DEPRECATED scalar compat (one migration phase)
            permissions: permList,
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

function toJwk(pem, keyId) {
    const jwk = crypto.createPublicKey(pem).export({ format: 'jwk' });
    return { kty: 'RSA', use: 'sig', alg: 'RS256', kid: keyId, n: jwk.n, e: jwk.e };
}

function getJwks() {
    if (_jwksCache) return _jwksCache;
    const { publicKey, kid } = loadKeys();
    const keys = [toJwk(publicKey, kid)];

    // Future-proof rotation: optionally publish additional (retiring/previous)
    // public keys so verifiers accept tokens signed by either kid during a roll.
    // JWT_ADDITIONAL_PUBLIC_KEYS = JSON map { "<kid>": "<pem>" }. No new signing key.
    if (process.env.JWT_ADDITIONAL_PUBLIC_KEYS) {
        try {
            const extra = JSON.parse(process.env.JWT_ADDITIONAL_PUBLIC_KEYS);
            for (const [k, pem] of Object.entries(extra)) {
                if (k !== kid) keys.push(toJwk(String(pem).replace(/\\n/g, '\n'), k));
            }
        } catch (_) { /* malformed extra keys ignored — active key still published */ }
    }

    _jwksCache = { keys };
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
