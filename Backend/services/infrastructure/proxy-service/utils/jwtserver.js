'use strict';
// Proxy identity issuer (RS256/JWKS) — delegates to the canonical authority
// (packages/auth-node). See catalog/enforce.mjs C3. RS256 with kid + JWKS,
// issuer/audience enforced on verify. R2: HS256 access tokens are rejected in ALL
// environments (no dev fallback) — verifyAccessToken is unconditionally RS256-only.
const path = require('path');
const { createAuthServer } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

const auth = createAuthServer({
    accessSecret:               config.jwt.accessSecret,
    refreshSecret:              config.jwt.refreshSecret,
    accessExpiresIn:            config.jwt.accessExpiresIn,
    refreshExpiresIn:           config.jwt.refreshExpiresIn,
    claimStyle:                 'canonical',   // Phase 2: emit sub/org_id/sid/roles[] (was 'sub' → organizationId/sessionId)
    normalizeClaims:            true,
    env:                        config.env,
    keysDir:                    process.env.JWT_KEYS_DIR || path.resolve(__dirname, '../config/keys'),
    activeKid:                  process.env.JWT_ACTIVE_KID || 'baalvion-key-1',
    issuer:                     process.env.JWT_ISSUER || 'baalvion-auth',
    audience:                   process.env.JWT_AUDIENCE || 'baalvion-platform',
    requireRs256InProduction:   true,
    // R2: HS256 access tokens are rejected in EVERY environment (dev included). The
    // central auth-service's RS256 tokens are verified via config/keys/<kid>.pub.
    // `allowHs256Fallback`/`JWT_ALLOW_HS256_FALLBACK` are inert (verifyAccessToken is
    // unconditionally RS256-only); pinned false so no env mistake can imply otherwise.
    allowHs256Fallback:         false,
    refreshIncludeJti:          false,  // legacy refresh shape omits jti
});

module.exports = {
    generateAccessToken:  auth.generateAccessToken,
    verifyAccessToken:    auth.verifyAccessToken,
    getJwks:              auth.getJwks,
    reloadKeys:           auth.reloadKeys,
    isRs256Enabled:       auth.isRs256Enabled,
    generateRefreshToken: auth.generateRefreshToken,
    verifyRefreshToken:   auth.verifyRefreshToken,
};
