'use strict';
const dotenv = require('dotenv');
dotenv.config();

const parseList = (v, f = []) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : f);

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3051),
    apiVersion: 'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:8080', 'http://localhost:3000']),
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || '',
        schema: process.env.DB_SCHEMA || 'insiders',
    },
    jwt: {
        accessSecret: require('@baalvion/auth-node').requireEnv('JWT_ACCESS_SECRET'),
        accessTtl: process.env.JWT_ACCESS_TTL || '24h',
        refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS || 30),
    },
    security: {
        ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 300),
        loginMaxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS || 5),
        loginLockoutMinutes: Number(process.env.LOGIN_LOCKOUT_MINUTES || 15),
    },
    uploads: {
        dir: process.env.UPLOAD_DIR || 'uploads',
        publicBaseUrl: process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3050}`,
    },
    ai: {
        apiKey: process.env.AI_API_KEY || '',
        baseUrl: process.env.AI_BASE_URL || 'https://ai.gateway.lovable.dev/v1',
        model: process.env.AI_MODEL || 'google/gemini-2.5-flash',
    },
    // Membership tiers (USD). Upgrade proration uses these prices.
    tiers: {
        founder: Number(process.env.TIER_FOUNDER || 299),
        investor_partner: Number(process.env.TIER_INVESTOR_PARTNER || 499),
    },
    upgradeGraceDays: Number(process.env.UPGRADE_GRACE_DAYS || 5),
    // Payment gateways — drop real keys here to go live (else providers run in demo mode).
    payments: {
        razorpay: { keyId: process.env.RAZORPAY_KEY_ID || '', keySecret: process.env.RAZORPAY_KEY_SECRET || '', webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '' },
        payu: { merchantKey: process.env.PAYU_MERCHANT_KEY || '', salt: process.env.PAYU_MERCHANT_SALT || '', baseUrl: process.env.PAYU_BASE_URL || 'https://secure.payu.in/_payment' },
        stripe: { secretKey: process.env.STRIPE_SECRET_KEY || '', publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '', webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '' },
        crypto: { apiKey: process.env.CRYPTO_API_KEY || '', webhookSecret: process.env.CRYPTO_WEBHOOK_SECRET || '', baseUrl: process.env.CRYPTO_BASE_URL || 'https://commerce.coinbase.com' },
    },
};
