const dotenv = require('dotenv');
dotenv.config();

const parseList = (value, fallback = []) => {
    if (!value) return fallback;
    return value.split(',').map(s => s.trim()).filter(Boolean);
};

const parseJson = (value, fallback = {}) => {
    if (!value) return fallback;
    try { return JSON.parse(value); } catch { return fallback; }
};

const port = Number(process.env.PORT || 3018);

module.exports = {
    env: process.env.NODE_ENV || 'development',
    version: process.env.SERVICE_VERSION || '1.0.0',
    port,
    apiVersion: 'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, [
        'http://localhost:3000',
        'http://localhost:3030',
        'http://localhost:5173',
    ]),
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
        schema: 'cms',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || undefined,
    },
    cache: {
        contentTtl: Number(process.env.CACHE_CONTENT_TTL || 300),   // 5 min
        publicTtl: Number(process.env.CACHE_PUBLIC_TTL || 600),     // 10 min
        taxonomyTtl: Number(process.env.CACHE_TAXONOMY_TTL || 1800), // 30 min
    },
    security: {
        ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 200),
    },
    // Unified Analytics Platform. Workers are gated so the same image runs as an
    // API replica (workers off) or a dedicated worker replica. Retention windows
    // (days) drive the nightly partition-drop + sweep; rollup_monthly is kept.
    analytics: {
        workersEnabled: process.env.ANALYTICS_WORKERS !== 'false',
        retention: {
            rawEventDays: Number(process.env.ANALYTICS_RETENTION_RAW_DAYS || 400),
            sessionDays: Number(process.env.ANALYTICS_RETENTION_SESSION_DAYS || 400),
            providerMetricDays: Number(process.env.ANALYTICS_RETENTION_PROVIDER_DAYS || 760),
            rollupDailyDays: Number(process.env.ANALYTICS_RETENTION_ROLLUP_DAILY_DAYS || 760),
        },
    },
    media: {
        serviceUrl: process.env.MEDIA_SERVICE_URL || 'http://localhost:3012',
    },
    // imperialpedia-service owns the subscriptions/plans tables — the premium-content gate in
    // service/entitlementClient.js resolves a caller's subscription through its internal
    // resolver rather than this service ever touching that schema directly.
    imperialpedia: {
        baseUrl: process.env.IMPERIALPEDIA_BASE_URL || 'http://localhost:3004/api/v1',
    },
    // On-publish revalidation: when content is published / unpublished / edited
    // live, cms-service calls the affected website's frontend revalidate webhook so
    // build-cached (ISR) pages refresh immediately instead of waiting out their TTL.
    //   REVALIDATE_SECRET    shared secret, sent as the `x-revalidate-secret` header
    //   REVALIDATE_WEBHOOKS  JSON map of websiteSlug -> frontend /api/revalidate URL
    //                        e.g. {"imperialpedia":"https://imperialpedia.baalvion.com/api/revalidate"}
    // Both unset → dispatch is a no-op (the public-cache bust still happens, so
    // dynamic/no-store sites already reflect edits on the next request).
    revalidate: {
        secret: process.env.REVALIDATE_SECRET || null,
        webhooks: parseJson(process.env.REVALIDATE_WEBHOOKS, {}),
        timeoutMs: Number(process.env.REVALIDATE_TIMEOUT_MS || 5000),
    },
    // Draft/unpublished content preview for the admin CMS editor's live-preview iframe.
    // cms-service signs a short-lived HMAC token scoped to one website+slug; the target
    // site's frontend never holds this secret, it only relays the token back here to
    // validate + fetch in one call (GET /public/:websiteSlug/content/:slug/preview).
    preview: {
        secret: process.env.CMS_PREVIEW_SECRET || null,
        ttlMs: Number(process.env.CMS_PREVIEW_TTL_MS || 15 * 60 * 1000),
    },
    notifications: {
        serviceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3013',
    },
    // ── @baalvion/sdk / platform wiring (INFRA config only — never secrets) ──
    // The shared service-to-service secret + event transport + log level the SDK
    // standardizes. CMS holds tenant secrets in its OWN encrypted vault (the
    // integrations store); it never reads provider keys from env here.
    internalSecret: process.env.INTERNAL_SERVICE_SECRET || 'baalvion-internal-dev-secret',
    // Self-referential CMS hub base. Used only if CMS ever resolves ANOTHER
    // tenant's cross-service config through sdk.config — never for its own reads.
    selfCmsApiBaseUrl: process.env.CMS_BASE_URL || `http://localhost:${port}/api/v1`,
    eventTransport: process.env.EVENT_TRANSPORT || 'noop',
    logLevel: process.env.LOG_LEVEL || 'info',
};

// Fail fast in non-development if the internal service secret — which guards the
// decrypted-keys resolver (GET /internal/integrations/:slug) — was left at the
// insecure development default. Prevents a misconfigured staging/prod from
// exposing the secret vault to anyone who knows the well-known dev string.
if (
    module.exports.env !== 'development' &&
    (!process.env.INTERNAL_SERVICE_SECRET || module.exports.internalSecret === 'baalvion-internal-dev-secret')
) {
    throw new Error(
        '[cms-service] INTERNAL_SERVICE_SECRET must be set in non-development environments — refusing to start with the dev default',
    );
}

// The AES vault key encrypts ALL tenant provider credentials at rest. A missing key
// silently falls back to a well-known dev default (secretCrypto.getKey) — fatal in
// non-dev, where the entire vault would be readable by anyone who knows that string.
if (module.exports.env !== 'development' && !process.env.CMS_SECRETS_KEY) {
    throw new Error(
        '[cms-service] CMS_SECRETS_KEY must be set in non-development environments — refusing to encrypt the vault with the dev default key',
    );
}
