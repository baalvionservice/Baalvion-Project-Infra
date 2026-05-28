'use strict';
require('dotenv').config();

module.exports = {
    port:    parseInt(process.env.PORT || '3023', 10),
    nodeEnv: process.env.NODE_ENV || 'development',

    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',').map(s => s.trim()),

    db: {
        host:     process.env.DB_HOST     || 'localhost',
        port:     parseInt(process.env.DB_PORT || '5432', 10),
        name:     process.env.DB_NAME     || 'baalvion_db',
        user:     process.env.DB_USER     || 'baalvion',
        password: process.env.DB_PASSWORD || '',
    },

    redis: {
        host:     process.env.REDIS_HOST     || 'localhost',
        port:     parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
    },

    // RS256 key pair — auth-service is the canonical signer, oauth-service shares the same private key
    jwt: {
        privateKeyPath: process.env.JWT_PRIVATE_KEY_PATH || undefined,
        privateKeyB64:  process.env.JWT_PRIVATE_KEY_B64  || undefined,
        privateKey:     process.env.JWT_PRIVATE_KEY       || undefined,
        publicKeyPath:  process.env.JWT_PUBLIC_KEY_PATH   || undefined,
        publicKeyB64:   process.env.JWT_PUBLIC_KEY_B64    || undefined,
        publicKey:      process.env.JWT_PUBLIC_KEY         || undefined,
        issuer:         process.env.JWT_ISSUER             || 'baalvion-auth',
        audience:       process.env.JWT_AUDIENCE           || 'baalvion',
    },

    oauth: {
        authCodeTtl:       parseInt(process.env.AUTH_CODE_TTL           || '600',    10),  // 10 min
        accessTokenTtl:    parseInt(process.env.OAUTH_ACCESS_TOKEN_TTL  || '3600',   10),  // 1 hour
        refreshTokenTtl:   parseInt(process.env.OAUTH_REFRESH_TOKEN_TTL || '2592000', 10), // 30 days
        baseUrl:           process.env.OAUTH_BASE_URL || 'http://localhost:3023',
        // Scopes supported by this server
        supportedScopes:   (process.env.OAUTH_SCOPES || 'openid profile email offline_access').split(' '),
    },
};
