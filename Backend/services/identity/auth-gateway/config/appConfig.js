'use strict';
require('dotenv').config();
const { requireEnv } = require('@baalvion/auth-node');

module.exports = {
  env:  process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3026),

  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001/v1/auth',
  jwksUri:        process.env.JWKS_URI || 'http://localhost:3001/.well-known/jwks.json',
  issuer:         process.env.JWT_ISSUER   || 'baalvion-auth',
  audience:       process.env.JWT_AUDIENCE || 'baalvion-platform',

  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3030').split(',').map((s) => s.trim()).filter(Boolean),

  // hybrid: gateway also injects the server-side Bearer (legacy backends keep verifying RS256).
  // strict: ONLY signed gateway identity headers are sent (backends trust the gateway via gatewayTrust()).
  enforcementMode: process.env.BFF_ENFORCEMENT_MODE === 'strict' ? 'strict' : 'hybrid',

  // HMAC secret the gateway signs trusted identity headers with; downstream backends verify it. Fail-closed.
  gatewaySigningSecret: requireEnv('GATEWAY_SIGNING_SECRET'),

  redis: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379), password: process.env.REDIS_PASSWORD || undefined },

  cookie: {
    accessName:    process.env.COOKIE_ACCESS_NAME  || 'access_token',
    refreshName:   process.env.COOKIE_REFRESH_NAME || 'refresh_token',
    csrfName:      process.env.CSRF_COOKIE_NAME    || 'csrf_token',   // NON-HttpOnly (double-submit)
    secure:        process.env.NODE_ENV === 'production',
    sameSite:      process.env.COOKIE_SAMESITE || 'lax',
    domain:        process.env.COOKIE_DOMAIN || undefined,
    accessMaxAge:  Number(process.env.COOKIE_ACCESS_MAX_AGE  || 15 * 60),
    refreshMaxAge: Number(process.env.COOKIE_REFRESH_MAX_AGE || 7 * 24 * 3600),
  },

  // Session fingerprint binding: UA mismatch rejects in prod (warns in dev); IP mismatch is soft (warn).
  binding: { rejectInProd: true },

  // Phase 6E-6.6 burn-in mode: observation-only window before HS256 retirement.
  burnInMode: process.env.BURN_IN_MODE === 'true',

  // Phase 7 — multi-region identity mesh + geo-fence
  region:         process.env.REGION           || 'local',
  workloadId:     process.env.WORKLOAD_ID      || 'auth-gateway',
  geoEnforcement: process.env.GEO_ENFORCEMENT  || 'log',   // log | warn | enforce
  envelopeTtl:    Number(process.env.ENVELOPE_TTL_SECONDS || 30),
};
