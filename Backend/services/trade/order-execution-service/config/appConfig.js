'use strict';
const dotenv = require('dotenv');
dotenv.config();

const parseList = (v, f = []) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : f);

const DEV_DEFAULTS = new Set(['changeme', 'secret', 'change_me', 'dev_finance_webhook_secret_change_me_min32']);

function requireSecret(envVar, devDefault, label) {
    const value = process.env[envVar];
    if (process.env.NODE_ENV === 'production') {
        if (!value || value.trim() === '' || DEV_DEFAULTS.has(value.trim())) {
            console.error(`[appConfig] FATAL: ${label} (${envVar}) missing or dev default in production.`);
            process.exit(1);
        }
        return value.trim();
    }
    return value || devDefault;
}

module.exports = {
    service: process.env.SERVICE_NAME || 'order-execution-service',
    version: '1.0.0',
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3052),
    // F3: own schema (not `trade`) — avoids the table collision with
    // commerce/trade-service which owns the canonical integer-keyed trade.orders.
    schema: process.env.DB_SCHEMA || 'oms',
    apiVersion: 'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000']),
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        // R1: services connect as the NON-SUPERUSER role so RLS is enforced.
        user: process.env.DB_USER || 'baalvion_app',
        password: process.env.DB_PASSWORD || '',
    },
    // F4: migrations run as the privileged OWNER role (not baalvion_app) so table
    // ownership + RLS DDL are correct and the app role stays subject to RLS.
    migration: {
        user: process.env.MIGRATION_DB_USER || process.env.DB_USER || 'baalvion_app',
        password: process.env.MIGRATION_DB_PASSWORD || process.env.DB_PASSWORD || '',
    },
    security: {
        ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 120),
        gatewaySigningSecret: requireSecret('GATEWAY_SIGNING_SECRET', 'dev_gateway_signing_secret', 'Gateway signing secret'),
    },
    finance: {
        webhookSecret: requireSecret('FINANCE_WEBHOOK_SECRET', 'dev_finance_webhook_secret_change_me_min32', 'Finance webhook secret'),
    },
    eventBus: {
        transport: process.env.EVENT_TRANSPORT || 'redis',
        stream: process.env.EVENT_STREAM || 'baalvion:events',
        consumerGroup: process.env.EVENT_CONSUMER_GROUP || 'order-execution-service',
    },
    cmsBaseUrl: process.env.CMS_BASE_URL || 'http://localhost:3011',
    internalSecret: process.env.INTERNAL_SERVICE_SECRET || 'dev_internal_secret',
    logLevel: process.env.LOG_LEVEL || 'info',
    bootstrapMigrations: process.env.BOOTSTRAP_MIGRATIONS !== 'false',
    startOutboxPublisher: process.env.OUTBOX_PUBLISHER !== 'false',
    startEventConsumer: process.env.EVENT_CONSUMER !== 'false',
    // DEV/trader-wedge only: simulate payment completion so orders advance placed→payment_confirmed
    // without the full Java payment rails. OFF by default; real payment-service emits the event in prod.
    startPaymentSimulator: process.env.PAYMENT_SIMULATOR === 'true',
};
