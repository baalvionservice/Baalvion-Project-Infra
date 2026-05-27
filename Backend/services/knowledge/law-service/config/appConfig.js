'use strict';
const dotenv = require('dotenv');
dotenv.config();

const parseList = (v, f = []) => v ? v.split(',').map(s => s.trim()).filter(Boolean) : f;

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3015),
    apiVersion: 'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000']),
    jwt: { accessSecret: require('@baalvion/auth-node').requireEnv('JWT_ACCESS_SECRET') },
    // Dual-issue window (Phase 4 A3): law login ALSO mints a canonical RS256 token via auth-service.
    dualIssue: {
        enabled:        process.env.LAW_DUAL_ISSUE_ENABLED === 'true',   // default OFF
        authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        internalSecret: process.env.INTERNAL_SERVICE_SECRET || '',
        serviceName:    'law',
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || '',
    },
    security: { ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 120) },
};
