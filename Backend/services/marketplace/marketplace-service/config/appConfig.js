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
    // Fallback org for self-service onboarding before a platform identity exists.
    defaultOrgId: process.env.MARKETPLACE_DEFAULT_ORG_ID || '52c76e5c-0668-4492-ba20-23e7ee16f49b',
    pagination: {
        defaultLimit: Number(process.env.MARKETPLACE_DEFAULT_LIMIT || 20),
        maxLimit: Number(process.env.MARKETPLACE_MAX_LIMIT || 100),
    },
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000']),
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
