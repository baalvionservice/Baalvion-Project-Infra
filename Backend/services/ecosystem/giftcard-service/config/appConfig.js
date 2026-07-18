const dotenv = require('dotenv');
dotenv.config();

const parseList = (v, f = []) => v ? v.split(',').map(s => s.trim()).filter(Boolean) : f;

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3065),
    apiVersion: 'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000']),
    jwt: {
        publicKey: require('@baalvion/auth-node').requireEnv('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
        issuer:    process.env.JWT_ISSUER   || 'baalvion-auth',
        audience:  process.env.JWT_AUDIENCE || 'baalvion-platform',
        jwksUri:   process.env.BAALVION_JWKS_URI || process.env.JWKS_URI || null,
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || '',
    },
    redis: {
        host: process.env.REDIS_HOST || 'redis',
        port: Number(process.env.REDIS_PORT || 6379),
    },
    security: {
        ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 120),
    },
    internal: {
        serviceSecret: process.env.INTERNAL_SERVICE_SECRET || 'baalvion-internal-dev-secret',
    },
    paymentServiceUrl: process.env.PAYMENT_SERVICE_URL || 'http://app-payments:3015',
    // Reloadly is the one real, working supplier (see service/suppliers/). Sandbox by default —
    // flip RELOADLY_ENV=production only once real inventory/settlement is wanted.
    reloadly: {
        clientId: process.env.RELOADLY_CLIENT_ID || '',
        clientSecret: process.env.RELOADLY_CLIENT_SECRET || '',
        env: process.env.RELOADLY_ENV || 'sandbox', // 'sandbox' | 'production'
    },
};
