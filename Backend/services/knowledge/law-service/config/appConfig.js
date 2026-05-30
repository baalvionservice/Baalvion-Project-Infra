'use strict';
const dotenv = require('dotenv');
dotenv.config();

const { getSecret, validateProductionSecrets } = require('./secrets');

const parseList = (v, f = []) => v ? v.split(',').map(s => s.trim()).filter(Boolean) : f;

// Fail fast in production if any of these are missing or still a dev placeholder.
validateProductionSecrets(['JWT_PUBLIC_KEY', 'DB_PASSWORD']);

const publicKey = (getSecret('JWT_PUBLIC_KEY') || require('@baalvion/auth-node').requireEnv('JWT_PUBLIC_KEY')).replace(/\\n/g, '\n');

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3015),
    apiVersion: 'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000']),
    // Phase 4 A4 cutover: law-service is VERIFY-ONLY (canonical RS256 from auth-service).
    jwt: {
        publicKey,
        issuer:    process.env.JWT_ISSUER   || 'baalvion-auth',
        audience:  process.env.JWT_AUDIENCE || 'baalvion-platform',
        jwksUri:   process.env.BAALVION_JWKS_URI || process.env.JWKS_URI || null,
    },
    // /login + /register now redirect to the canonical issuer.
    authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    // Public web origin (used in transactional emails for absolute links).
    appUrl: process.env.APP_PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9002',
    // Platform-admin bootstrap: these emails are always treated as Law Elite admins
    // (identity org-roles like "owner" do NOT grant platform admin — law authz is local).
    adminEmails: parseList(process.env.LAW_ADMIN_EMAILS, ['infra.baalvion@gmail.com']),
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion',
        password: getSecret('DB_PASSWORD', ''),
    },
    security: { ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 120) },
};
