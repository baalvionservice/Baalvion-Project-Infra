'use strict';
const dotenv = require('dotenv');
dotenv.config();

const parseList = (value, fallback = []) => {
    if (!value) return fallback;
    return value.split(',').map((s) => s.trim()).filter(Boolean);
};

module.exports = {
    env:         process.env.NODE_ENV   || 'development',
    port:        Number(process.env.PORT || 3055),
    apiVersion:  'v1',
    baseUrl:     process.env.API_BASE_URL || 'http://localhost:3055',
    corsOrigins: parseList(process.env.CORS_ORIGINS, [
        'http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080', 'http://localhost:3030',
    ]),

    jwt: {
        // RS256 is the canonical scheme (verify-only here — rbac-service never issues
        // user tokens). The HS256 secret is a DEV-ONLY fallback so the service boots
        // without RSA keys; in production JWT_PUBLIC_KEY drives verification.
        accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-insecure-rbac-secret',
        issuer:       process.env.JWT_ISSUER   || 'baalvion-auth',
        audience:     process.env.JWT_AUDIENCE || 'baalvion-platform',
    },

    // Optional shared secret for service-to-service PDP calls (PEP → /v1/authorize).
    // Empty = disabled (every caller must present a user token).
    internalApiKey: process.env.INTERNAL_API_KEY || '',

    db: {
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT || 5432),
        name:     process.env.DB_NAME     || 'baalvion_db',
        user:     process.env.DB_USER     || 'baalvion',
        password: process.env.DB_PASSWORD || '',
        schema:   process.env.DB_SCHEMA   || 'rbac',
    },
};
