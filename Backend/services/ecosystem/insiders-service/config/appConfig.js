'use strict';
const dotenv = require('dotenv');
dotenv.config();

const parseList = (v, f = []) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : f);

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3050),
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
    // Payments. This service holds NO PSP keys — checkout relays to the JVM payment-service,
    // which owns the merchant credentials and resolves the provider per site from the CMS vault.
    // The local adapters that used to read RAZORPAY_*/PAYU_*/STRIPE_*/CRYPTO_* here never called
    // a provider and verified payment from a client-supplied status field; see payments/index.js.
    payments: {
        serviceUrl: process.env.PAYMENT_SERVICE_URL || 'http://app-payments:3015',
        siteSlug: process.env.PAYMENT_SITE_SLUG || 'baalvion-elite-circle',
    },
};
