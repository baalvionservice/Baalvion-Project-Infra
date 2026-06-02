const dotenv = require('dotenv');
dotenv.config();

const parseList = (value, fallback = []) => {
    if (!value) return fallback;
    return value.split(',').map(s => s.trim()).filter(Boolean);
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
    media: {
        serviceUrl: process.env.MEDIA_SERVICE_URL || 'http://localhost:3012',
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
