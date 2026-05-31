'use strict';
// Verify-only token adapter via @baalvion/auth-node (no second issuer).
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
