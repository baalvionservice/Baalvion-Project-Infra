'use strict';
require('dotenv').config();

module.exports = {
  port:       Number(process.env.PORT || 3017),
  env:        process.env.NODE_ENV || 'development',
  apiVersion: 'v1',
  serviceName:'ctm-service',

  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3025').split(',').map(s => s.trim()),

  jwt: {
    publicKey: require('@baalvion/auth-node').requireEnv('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
    issuer:    process.env.JWT_ISSUER   || 'baalvion-auth',
    audience:  process.env.JWT_AUDIENCE || 'baalvion-platform',
    jwksUri:   process.env.BAALVION_JWKS_URI || process.env.JWKS_URI || null,
  },

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
