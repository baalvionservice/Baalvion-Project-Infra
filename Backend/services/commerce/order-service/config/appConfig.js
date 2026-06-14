const path = require('path');
const dotenv = require('dotenv');
// Load THIS service's .env with override so newly-added vars (e.g. CART_SESSION_SECRET) win
// over a stale long-lived pm2-daemon environment that would otherwise shadow them. In
// production no .env is shipped (env comes from Secrets Manager), so this is a safe no-op.
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

const parseList = (value, fallback = []) => {
    if (!value) return fallback;
    return value.split(',').map(s => s.trim()).filter(Boolean);
};

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3013),
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000', 'http://localhost:3030', 'http://localhost:5173']),
    jwt: {
        publicKey: require('@baalvion/auth-node').requireEnv('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
        issuer:    process.env.JWT_ISSUER   || 'baalvion-auth',
        audience:  process.env.JWT_AUDIENCE || 'baalvion-platform',
        jwksUri:   process.env.JWKS_URI     || null,
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || '',
        schema: 'orders',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || undefined,
    },
    cache: {
        orderTtl: Number(process.env.CACHE_ORDER_TTL || 120),
        customerTtl: Number(process.env.CACHE_CUSTOMER_TTL || 300),
        cartTtl: Number(process.env.CACHE_CART_TTL || 1800),
        rbacEffectiveTtl: Number(process.env.CACHE_RBAC_EFFECTIVE_TTL || 30),
        rbacScopeTtl: Number(process.env.CACHE_RBAC_SCOPE_TTL || 300),
    },
    security: { ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 200) },
    // Guest-cart session signing. Anonymous carts are bound to a server-generated session id,
    // handed to the client as an HMAC-signed token. Empty secret = guest carts disabled (fail-closed).
    session: { signingSecret: process.env.CART_SESSION_SECRET || '' },
    // RBAC is the single source of truth; this service is a Policy Enforcement Point via
    // @baalvion/commerce-rbac. Store→country is resolved from the RBAC tenant tree (no commerce DB).
    rbac: {
        baseUrl:       process.env.RBAC_BASE_URL || 'http://localhost:3055',
        apiPrefix:     process.env.RBAC_API_PREFIX || '/v1',
        timeoutMs:     Number(process.env.RBAC_TIMEOUT_MS || 4000),
        failMode:      (process.env.RBAC_FAIL_MODE || 'closed').toLowerCase(),
        breakglassSuperAdmin: process.env.RBAC_BREAKGLASS_SUPERADMIN !== 'false',
        internalApiKey: process.env.RBAC_INTERNAL_API_KEY || '',
    },
    // Double-entry financial ledger (ledger-service). Captured payments and refunds are mirrored
    // as journal entries for reconciliation. Posting is ENABLED only when an internal key is
    // configured (shared with ledger-service's LEDGER_INTERNAL_KEY); otherwise it is skipped
    // fail-open so checkout never breaks on a ledger outage — the reconciliation report surfaces
    // any resulting gap. transactionRef gives idempotency, so a later backfill is always safe.
    ledger: {
        baseUrl:     process.env.LEDGER_BASE_URL || 'http://localhost:3014',
        apiPrefix:   process.env.LEDGER_API_PREFIX || '/v1',
        internalKey: process.env.LEDGER_INTERNAL_KEY || '',
        timeoutMs:   Number(process.env.LEDGER_TIMEOUT_MS || 4000),
        get enabled() { return !!this.internalKey; },
    },
    // Outbound operational alerts (reconciliation drift, ledger unreachable) → notification-service.
    // Fire-and-forget, fail-open: an alert delivery failure must never affect order processing.
    notifications: {
        baseUrl:     process.env.NOTIFICATION_BASE_URL || 'http://localhost:3031',
        apiPrefix:   process.env.NOTIFICATION_API_PREFIX || '/v1',
        internalKey: process.env.INTERNAL_SERVICE_SECRET || process.env.NOTIFICATION_INTERNAL_KEY || '',
        opsUserId:   process.env.OPS_ALERT_USER_ID || '',
        opsEmail:    process.env.OPS_ALERT_EMAIL || '',
        timeoutMs:   Number(process.env.NOTIFICATION_TIMEOUT_MS || 4000),
        get enabled() { return !!this.internalKey && (!!this.opsUserId || !!this.opsEmail); },
        // Transactional order emails (confirmation/paid) → notification-service. Independent of
        // the ops-alert toggle above: only an internal key is required (recipient is the customer,
        // not OPS_ALERT_*). Fail-open — a delivery failure never affects checkout.
        get orderEmailsEnabled() { return !!this.internalKey; },
        // Base URL used to build the {{orderUrl}} link in customer order emails.
        storefrontUrl: process.env.STOREFRONT_URL || process.env.APP_URL || 'http://localhost:3000',
    },
    // Scheduled reconciliation sweep (BullMQ repeatable). Sweeps active stores, compares order
    // payments/refunds to the ledger, alerts on drift, and (optionally) auto-backfills missing entries.
    reconcile: {
        enabled:      process.env.RECONCILE_ENABLED !== 'false',
        cron:         process.env.RECONCILE_CRON || '0 * * * *', // hourly
        autoBackfill: process.env.RECONCILE_AUTO_BACKFILL === 'true',
        lookbackDays: Number(process.env.RECONCILE_LOOKBACK_DAYS || 7),
    },
};
