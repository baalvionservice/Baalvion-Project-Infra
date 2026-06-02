'use strict';
/**
 * Canonical RS256 auth for the legacy /v1/payments routes (interbank fund movement).
 *
 * Replaces the prior STUB that accepted ANY bearer token and trusted a
 * caller-supplied x-tenant-id header — a fund-movement auth + tenant-isolation
 * bypass. Verification is delegated to @baalvion/auth-node (the One True Verifier:
 * RS256, JWKS or static key); the tenant is taken ONLY from the verified org claim,
 * never from a header.
 */
const { createAuthMiddleware } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

const _verify = createAuthMiddleware({
  jwksUri: process.env.JWKS_URI || config.auth.jwksUri,
  issuer: config.auth.issuer,
  audience: config.auth.audience,
  staticPublicKey: process.env.JWT_PUBLIC_KEY ? process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n') : undefined,
});

function authMiddleware(req, res, next) {
  return _verify(req, res, (err) => {
    if (err) {
      return res.status(err.status || 401).json({ error: (err.code || 'UNAUTHORIZED').toUpperCase(), message: err.message || 'Unauthorized' });
    }
    // Mirror the verified principal onto req.user for the legacy controllers.
    // tenant comes from the VERIFIED org claim only.
    const a = req.auth || {};
    req.user = { sub: a.userId || a.subject, tenantId: a.orgId || null, roles: a.roles || [] };
    next();
  });
}

module.exports = authMiddleware;
