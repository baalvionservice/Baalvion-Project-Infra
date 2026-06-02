'use strict';
/**
 * Canonical token verification adapter.
 *
 * rbac-service is a VERIFY-ONLY consumer: it never mints user tokens. It reuses
 * the single permitted JWT authority (@baalvion/auth-node) — per CLAUDE.md we do
 * NOT hand-roll jsonwebtoken here nor introduce a second issuer.
 *
 * Verification cascade handled by auth-node `createAuthServer`:
 *   - RS256 against JWT_PUBLIC_KEY / JWT_PUBLIC_KEYS / JWT_KEYS_DIR (canonical)
 *   - HS256 against accessSecret (DEV-ONLY fallback when no RSA key is present)
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
