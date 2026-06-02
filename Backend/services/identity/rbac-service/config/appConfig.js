'use strict';
const dotenv = require('dotenv');
dotenv.config();

const parseList = (value, fallback = []) => {
    if (!value) return fallback;
    return value.split(',').map((s) => s.trim()).filter(Boolean);
};

// ── Production secret guard ──────────────────────────────────────────────────
// rbac-service is a VERIFY-ONLY consumer of JWTs; the RS256 public key is the
// only legitimate verification mechanism in production. If the key is absent
// (or still set to the well-known dev placeholder) in a production deployment,
// the service would silently fall back to the HS256 dev secret — an exploitable
// misconfiguration. Fail hard so the deployment surface is always known.
//
// Known dev/default literals that must NOT appear in production:
const _DEV_JWT_SECRETS = new Set([
    'dev-insecure-rbac-secret',
    'dev-secret',
    'changeme',
    'secret',
]);

if (process.env.NODE_ENV === 'production') {
    // auth-node accepts RS256 public key material via three env vars (in priority
    // order): JWT_PUBLIC_KEYS (JSON map), JWT_PUBLIC_KEY (single PEM), or
    // JWT_KEYS_DIR (directory of .pub files). If none of these is set the service
    // silently falls back to HS256 with the dev secret — an exploitable
    // misconfiguration. Fail hard if no RS256 key source is present at all.
    const hasPublicKey   = !!(process.env.JWT_PUBLIC_KEY   && process.env.JWT_PUBLIC_KEY.trim());
    const hasPublicKeys  = !!(process.env.JWT_PUBLIC_KEYS  && process.env.JWT_PUBLIC_KEYS.trim());
    const hasKeysDir     = !!(process.env.JWT_KEYS_DIR     && process.env.JWT_KEYS_DIR.trim());
    if (!hasPublicKey && !hasPublicKeys && !hasKeysDir) {
        // eslint-disable-next-line no-console
        console.error(
            '[RBAC] FATAL: No RS256 public key source configured in production. ' +
            'Set JWT_PUBLIC_KEY, JWT_PUBLIC_KEYS, or JWT_KEYS_DIR. ' +
            'Refusing to start with HS256 fallback.'
        );
        process.exit(1);
    }

    const accessSecret = process.env.JWT_ACCESS_SECRET;
    if (accessSecret && _DEV_JWT_SECRETS.has(accessSecret.trim())) {
        // eslint-disable-next-line no-console
        console.error('[RBAC] FATAL: JWT_ACCESS_SECRET is set to a known dev/default literal in production. Rotate it.');
        process.exit(1);
    }
}
// ────────────────────────────────────────────────────────────────────────────

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
