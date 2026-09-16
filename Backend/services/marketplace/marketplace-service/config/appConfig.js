'use strict';
const dotenv = require('dotenv');
dotenv.config();

const parseList = (v, f = []) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : f);

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3060),
    apiVersion: 'v1',
    supportedVersions: ['v1'],
    schema: 'marketplace',
    // Public investor-facing frontend — invitation emails link here to start onboarding.
    appUrl: process.env.MARKETPLACE_APP_URL || 'http://localhost:3000',
    pagination: {
        defaultLimit: Number(process.env.MARKETPLACE_DEFAULT_LIMIT || 20),
        maxLimit: Number(process.env.MARKETPLACE_MAX_LIMIT || 100),
    },
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000']),
    security: {
        ipRateLimit: Number(process.env.MARKETPLACE_IP_RATE_LIMIT || 120),
        dealWriteRateLimit: Number(process.env.MARKETPLACE_DEAL_WRITE_RATE_LIMIT || 30),
        webhookRateLimit: Number(process.env.MARKETPLACE_WEBHOOK_RATE_LIMIT || 300),
    },
    jwt: {
        // Optional at boot — the canonical verifier is created lazily on first protected
        // request (so the service still boots in dev without a key configured).
        publicKey: (process.env.JWT_PUBLIC_KEY || '').replace(/\\n/g, '\n') || null,
        issuer: process.env.JWT_ISSUER || 'baalvion-auth',
        audience: process.env.JWT_AUDIENCE || 'baalvion-platform',
        jwksUri: process.env.BAALVION_JWKS_URI || process.env.JWKS_URI || null,
    },
    db: {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || '',
    },
};
