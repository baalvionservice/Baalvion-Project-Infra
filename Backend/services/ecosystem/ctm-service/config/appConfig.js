'use strict';
require('dotenv').config();

module.exports = {
  port:       Number(process.env.PORT || 3017),
  env:        process.env.NODE_ENV || 'development',
  apiVersion: 'v1',
  serviceName:'ctm-service',

  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3025').split(',').map(s => s.trim()),

  // Token-verification source (central-SSO adapter). JWKS is PREFERRED: the service fetches the
  // central auth's current RS256 public key from its /.well-known/jwks.json, so key rotation needs
  // no redeploy. A static JWT_PUBLIC_KEY is still accepted and is used as a fallback when JWKS is
  // briefly unreachable (auth-node verifies via JWKS first, then the static key). Fail-closed: the
  // service refuses to boot unless at least ONE source is configured.
  jwt: (() => {
    const rawKey  = process.env.JWT_PUBLIC_KEY;
    const jwksUri = process.env.BAALVION_JWKS_URI || process.env.JWKS_URI || null;
    if (!rawKey && !jwksUri) {
      throw new Error('Auth misconfigured: set BAALVION_JWKS_URI/JWKS_URI (preferred) or JWT_PUBLIC_KEY so the service can verify RS256 access tokens (fail-closed).');
    }
    return {
      publicKey: rawKey ? rawKey.replace(/\\n/g, '\n') : null,
      issuer:    process.env.JWT_ISSUER   || 'baalvion-auth',
      audience:  process.env.JWT_AUDIENCE || 'baalvion-platform',
      jwksUri,
    };
  })(),

  db: {
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT || 5432),
    name:     process.env.DB_NAME     || 'baalvion_db',
    user:     process.env.DB_USER     || 'baalvion',
    password: process.env.DB_PASSWORD || '',
  },

  rateLimit: {
    windowMs: 60_000,
    max:      Number(process.env.RATE_LIMIT_IP_MAX || 120),
  },
};
