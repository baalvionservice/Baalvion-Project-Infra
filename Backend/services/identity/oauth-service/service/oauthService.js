'use strict';
const { v4: uuidv4 }  = require('uuid');
const { OAuthError }  = require('../utils/errors');
const { generateCode, sha256, verifyPkce } = require('../utils/crypto');
const { signToken, verifyToken }            = require('../utils/keys');
const clientService   = require('./clientService');
const redis           = require('../config/redis');
const logger          = require('../utils/logger');
const config          = require('../config/appConfig');

let _db;
function getDb() {
    if (!_db) _db = require('../models');
    return _db;
}

// ── Authorization Code (+ PKCE) ───────────────────────────────────────────────

async function createAuthorizationCode({ clientId, userId, orgId, redirectUri, scopes, pkceChallenge, pkceMethod, nonce }) {
    const db     = getDb();
    const code   = generateCode(32);
    const codeHash = sha256(code);
    const expiresAt = new Date(Date.now() + config.oauth.authCodeTtl * 1000);

    await db.sequelize.query(
        `INSERT INTO auth.oauth_authorization_codes
            (id, client_id, user_id, org_id, code_hash, redirect_uri, scopes,
             pkce_challenge, pkce_method, nonce, expires_at, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW())`,
        {
            bind: [uuidv4(), clientId, userId, orgId, codeHash, redirectUri,
                   JSON.stringify(scopes), pkceChallenge || null, pkceMethod || null, nonce || null, expiresAt],
        }
    );
    return code;
}

async function exchangeCodeForTokens({ code, clientId, redirectUri, codeVerifier }) {
    const db       = getDb();
    const codeHash = sha256(code);

    const [row] = await db.sequelize.query(
        `SELECT * FROM auth.oauth_authorization_codes
         WHERE code_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [codeHash] }
    );

    if (!row) throw new OAuthError('invalid_grant', 'Authorization code invalid or expired');
    if (row.client_id !== clientId) throw new OAuthError('invalid_grant', 'Client mismatch');
    if (redirectUri && row.redirect_uri !== redirectUri) throw new OAuthError('invalid_grant', 'Redirect URI mismatch');

    // PKCE verification
    if (row.pkce_challenge) {
        if (!codeVerifier) throw new OAuthError('invalid_grant', 'code_verifier required');
        if (!verifyPkce(codeVerifier, row.pkce_challenge, row.pkce_method || 'S256')) {
            throw new OAuthError('invalid_grant', 'PKCE verification failed');
        }
    }

    // Mark code as used (single-use)
    await db.sequelize.query(
        'UPDATE auth.oauth_authorization_codes SET used_at = NOW() WHERE code_hash = $1',
        { bind: [codeHash] }
    );

    const scopes = typeof row.scopes === 'string' ? JSON.parse(row.scopes) : row.scopes;
    const tokens = await issueTokens({ userId: row.user_id, orgId: row.org_id, clientId, scopes, nonce: row.nonce });
    return tokens;
}

// ── Client Credentials ────────────────────────────────────────────────────────

async function clientCredentialsGrant({ clientId, scopes }) {
    // For client_credentials, sub = clientId (no user context)
    const accessToken = signToken(
        { sub: clientId, client_id: clientId, scope: scopes.join(' '), type: 'access', jti: uuidv4() },
        `${config.oauth.accessTokenTtl}s`
    );
    return {
        access_token: accessToken,
        token_type:   'Bearer',
        expires_in:   config.oauth.accessTokenTtl,
        scope:        scopes.join(' '),
    };
}

// ── Refresh Token ─────────────────────────────────────────────────────────────

async function refreshTokenGrant({ refreshToken, clientId }) {
    const db           = getDb();
    const tokenHash    = sha256(refreshToken);

    const [row] = await db.sequelize.query(
        `SELECT rt.*, s.user_id AS s_user_id FROM auth.oauth_refresh_tokens rt
         WHERE rt.token_hash = $1 AND rt.revoked_at IS NULL AND rt.expires_at > NOW()`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [tokenHash] }
    );

    if (!row) throw new OAuthError('invalid_grant', 'Refresh token invalid or expired');
    if (row.client_id !== clientId) throw new OAuthError('invalid_grant', 'Client mismatch');

    // Revoke old refresh token (rotation)
    await db.sequelize.query(
        'UPDATE auth.oauth_refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
        { bind: [tokenHash] }
    );

    const scopes = typeof row.scopes === 'string' ? JSON.parse(row.scopes) : row.scopes;
    const tokens = await issueTokens({ userId: row.user_id, orgId: row.org_id, clientId, scopes });
    return tokens;
}

// ── Token issuing ─────────────────────────────────────────────────────────────

async function issueTokens({ userId, orgId, clientId, scopes, nonce }) {
    const db          = getDb();
    const jti         = uuidv4();
    const accessToken = signToken(
        {
            sub: String(userId), org_id: orgId, client_id: clientId,
            scope: scopes.join(' '), type: 'access', jti,
        },
        `${config.oauth.accessTokenTtl}s`
    );

    let idToken = null;
    if (scopes.includes('openid')) {
        const [user] = await db.sequelize.query(
            'SELECT id, email, full_name, avatar_url FROM auth.users WHERE id = $1',
            { type: db.Sequelize.QueryTypes.SELECT, bind: [userId] }
        );
        if (user) {
            const claims = { sub: String(user.id) };
            if (scopes.includes('profile')) { claims.name = user.full_name; claims.picture = user.avatar_url; }
            if (scopes.includes('email'))   { claims.email = user.email; }
            if (nonce) claims.nonce = nonce;
            idToken = signToken(claims, `${config.oauth.accessTokenTtl}s`);
        }
    }

    let refreshToken = null;
    if (scopes.includes('offline_access')) {
        refreshToken = generateCode(48);
        const tokenHash  = sha256(refreshToken);
        const expiresAt  = new Date(Date.now() + config.oauth.refreshTokenTtl * 1000);
        await db.sequelize.query(
            `INSERT INTO auth.oauth_refresh_tokens (id, user_id, org_id, client_id, token_hash, scopes, expires_at, created_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
            { bind: [uuidv4(), userId, orgId, clientId, tokenHash, JSON.stringify(scopes), expiresAt] }
        );
    }

    return {
        access_token:  accessToken,
        token_type:    'Bearer',
        expires_in:    config.oauth.accessTokenTtl,
        scope:         scopes.join(' '),
        ...(refreshToken && { refresh_token: refreshToken }),
        ...(idToken      && { id_token: idToken }),
    };
}

// ── Introspection (RFC 7662) ──────────────────────────────────────────────────

async function introspectToken(token) {
    try {
        const decoded = verifyToken(token);
        // Check JTI blacklist
        const r = redis.getClient();
        if (decoded.jti && r && redis.isAvailable()) {
            const revoked = await r.get(`auth:bl:${decoded.jti}`);
            if (revoked) return { active: false };
        }
        return {
            active:     true,
            sub:        decoded.sub,
            client_id:  decoded.client_id,
            scope:      decoded.scope,
            exp:        decoded.exp,
            iat:        decoded.iat,
            iss:        decoded.iss,
            jti:        decoded.jti,
        };
    } catch {
        return { active: false };
    }
}

// ── Revocation (RFC 7009) ─────────────────────────────────────────────────────

async function revokeToken(token, tokenTypeHint) {
    const db = getDb();
    // Try refresh token first
    const tokenHash = sha256(token);
    const [rt] = await db.sequelize.query(
        'SELECT id FROM auth.oauth_refresh_tokens WHERE token_hash = $1 AND revoked_at IS NULL',
        { type: db.Sequelize.QueryTypes.SELECT, bind: [tokenHash] }
    );
    if (rt) {
        await db.sequelize.query(
            'UPDATE auth.oauth_refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1',
            { bind: [tokenHash] }
        );
        return;
    }

    // Try access token — blacklist the JTI in Redis
    try {
        const decoded = verifyToken(token);
        if (decoded.jti) {
            const r = redis.getClient();
            if (r && redis.isAvailable()) {
                const ttl = decoded.exp - Math.floor(Date.now() / 1000);
                if (ttl > 0) await r.set(`auth:bl:${decoded.jti}`, '1', 'EX', ttl);
            }
        }
    } catch { /* ignore */ }
}

// ── UserInfo (OIDC) ───────────────────────────────────────────────────────────

async function getUserInfo(userId, scopes) {
    const db = getDb();
    const [user] = await db.sequelize.query(
        `SELECT u.id, u.email, u.full_name, u.avatar_url, u.email_verified_at
         FROM auth.users u WHERE u.id = $1`,
        { type: db.Sequelize.QueryTypes.SELECT, bind: [userId] }
    );
    if (!user) return { sub: String(userId) };

    const claims = { sub: String(user.id) };
    if (scopes.includes('profile')) {
        claims.name    = user.full_name;
        claims.picture = user.avatar_url || null;
    }
    if (scopes.includes('email')) {
        claims.email          = user.email;
        claims.email_verified = !!user.email_verified_at;
    }
    return claims;
}

// ── OIDC Discovery document ───────────────────────────────────────────────────

function buildDiscoveryDocument() {
    const base = config.oauth.baseUrl;
    return {
        issuer:                                base,
        authorization_endpoint:                `${base}/oauth/authorize`,
        token_endpoint:                        `${base}/oauth/token`,
        userinfo_endpoint:                     `${base}/oauth/userinfo`,
        jwks_uri:                              `${base}/.well-known/jwks.json`,
        revocation_endpoint:                   `${base}/oauth/revoke`,
        introspection_endpoint:                `${base}/oauth/introspect`,
        end_session_endpoint:                  `${base}/oauth/logout`,
        backchannel_logout_supported:          true,
        backchannel_logout_session_supported:  true,
        response_types_supported:              ['code'],
        grant_types_supported:                 ['authorization_code', 'client_credentials', 'refresh_token'],
        subject_types_supported:               ['public'],
        id_token_signing_alg_values_supported: ['RS256'],
        scopes_supported:                      config.oauth.supportedScopes,
        token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
        claims_supported:                      ['sub', 'email', 'email_verified', 'name', 'picture'],
        code_challenge_methods_supported:      ['S256', 'plain'],
    };
}

module.exports = {
    createAuthorizationCode,
    exchangeCodeForTokens,
    clientCredentialsGrant,
    refreshTokenGrant,
    introspectToken,
    revokeToken,
    getUserInfo,
    buildDiscoveryDocument,
};
