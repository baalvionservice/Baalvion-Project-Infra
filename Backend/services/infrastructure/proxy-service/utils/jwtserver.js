'use strict';
// Proxy identity issuer (RS256/JWKS) — delegates to the canonical authority
// (packages/auth-node). See catalog/enforce.mjs C3. RS256 with kid + JWKS, HS256
// migration fallback, issuer/audience enforced on RS256 verify — byte-equivalent
// to the prior in-file implementation.
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
    hs256IncludeIssuerAudience: true,   // HS256 fallback tokens carry iss/aud
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
