'use strict';
/**
 * Canonical token verification adapter.
 *
 * rbac-service is a VERIFY-ONLY consumer: it never mints user tokens. It reuses
 * the single permitted JWT authority (@baalvion/auth-node) — per CLAUDE.md we do
 * NOT hand-roll jsonwebtoken here nor introduce a second issuer.
 *
 * Verification handled by auth-node `createAuthServer` — RS256-ONLY (R2):
 *   - RS256 against JWT_PUBLIC_KEY / JWT_PUBLIC_KEYS / JWT_KEYS_DIR (canonical)
 *   - No HS256 path: verifyAccessToken rejects any non-RS256 alg; production fails
 *     closed without an RS256 public key (see appConfig.js production secret guard).
 *
 * `normalizeClaims` exposes both canonical (org_id/sid/roles) and legacy aliases
 * (organizationId/sessionId) so claim reads are stable across the migration window.
 */
const { createAuthServer } = require('@baalvion/auth-node');
const config = require('./appConfig');

const authServer = createAuthServer({
    accessSecret:    config.jwt.accessSecret,
    issuer:          config.jwt.issuer,
    audience:        config.jwt.audience,
    normalizeClaims: true,
    claimStyle:      'canonical',
});

module.exports = {
    verifyAccessToken: (token) => authServer.verifyAccessToken(token),
    isRs256Enabled:    () => authServer.isRs256Enabled(),
};
