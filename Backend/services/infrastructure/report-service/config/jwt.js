'use strict';
// Verify-only token adapter via @baalvion/auth-node (the single JWT authority — no
// second issuer). RS256-ONLY: verifyAccessToken rejects any non-RS256 alg (R2); in
// production the verifier fails closed if no RS256 public key is configured.
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
    verifyAccessToken: (t) => authServer.verifyAccessToken(t),
    isRs256Enabled:    () => authServer.isRs256Enabled(),
};
