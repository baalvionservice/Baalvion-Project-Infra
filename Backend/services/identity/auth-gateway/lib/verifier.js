'use strict';
// The gateway verifies access tokens RS256-ONLY against auth-service JWKS, enforces the
// canonical claim contract, and checks the shared JTI blacklist (fail-CLOSED) on every verify.
const { createJwksVerifier } = require('@baalvion/auth-node');
const config = require('../config/appConfig');
const redis = require('./redis');

module.exports = createJwksVerifier({
  jwksUri:       config.jwksUri,
  issuer:        config.issuer,
  audience:      config.audience,
  rejectHs256:   true,                       // gateway is canonical RS256 only
  requiredClaims: ['sub', 'sid', 'jti'],     // need sub (user), sid (session key), jti (revocation)
  validateRolesPermissions: true,
  redis,                                     // auth:blacklist:<jti> — revoked tokens rejected everywhere
});
