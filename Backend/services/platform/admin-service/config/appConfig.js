'use strict';
require('dotenv').config();

const config = {
    env:         process.env.NODE_ENV || 'development',
    port:        parseInt(process.env.PORT || '3021', 10),
    apiVersion:  'v1',
    serviceName: 'admin-service',

    db: {
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT || '5432', 10),
        name:     process.env.DB_NAME     || 'baalvion_db',
        user:     process.env.DB_USER     || 'baalvion',
        password: require('@baalvion/auth-node').requireEnv('DB_PASSWORD'), // fail-closed: no dev-default password
    },

    redis: {
        host:     process.env.REDIS_HOST     || '',
        port:     parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || '',
    },

    jwt: {
        publicKeyPath: process.env.JWT_PUBLIC_KEY_PATH || '',
        publicKeyB64:  process.env.JWT_PUBLIC_KEY_B64  || '',
        publicKey:     process.env.JWT_PUBLIC_KEY      || '',
        jwksUri:       process.env.BAALVION_JWKS_URI || process.env.JWKS_URI || null,
        issuer:        process.env.JWT_ISSUER    || 'baalvion-auth',
        audience:      process.env.JWT_AUDIENCE  || 'baalvion-platform',
        // Impersonation tokens carry a DISTINCT issuer so canonical consumers never
        // accept them implicitly (fail-closed). A service that honors impersonation
        // must explicitly opt into this issuer.
        impersonationIssuer: process.env.JWT_IMPERSONATION_ISSUER || 'baalvion-auth-impersonation',
    },

    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3030').split(',').map(s => s.trim()),

    // Auth service for user lookups
    authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',

    // Impersonation token TTL — short-lived + audited (security policy: max 15 minutes)
    impersonationTtl: 15 * 60, // 15 minutes

    eventBus: {
        stream: process.env.EVENT_BUS_STREAM || 'baalvion:events',
    },
};

module.exports = config;
