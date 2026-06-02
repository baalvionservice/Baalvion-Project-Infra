const dotenv = require('dotenv');
dotenv.config();

const parseList = (value, fallback = []) => {
    if (!value) return fallback;
    return value.split(',').map(s => s.trim()).filter(Boolean);
};

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3012),
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
        jwksUri:   process.env.JWKS_URI     || null,
    },
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        name: process.env.DB_NAME || 'baalvion_db',
        user: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || '',
        schema: 'commerce',
    },
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT || 6379),
        password: process.env.REDIS_PASSWORD || undefined,
    },
    cache: {
        storeTtl: Number(process.env.CACHE_STORE_TTL || 300),        // 5 min
        productTtl: Number(process.env.CACHE_PRODUCT_TTL || 300),    // 5 min
        categoryTtl: Number(process.env.CACHE_CATEGORY_TTL || 1800), // 30 min
        collectionTtl: Number(process.env.CACHE_COLLECTION_TTL || 600), // 10 min
        rbacEffectiveTtl: Number(process.env.CACHE_RBAC_EFFECTIVE_TTL || 30), // 30s — short, role grants change
        rbacScopeTtl: Number(process.env.CACHE_RBAC_SCOPE_TTL || 300),        // 5 min — store→country context
    },
    security: {
        ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 200),
    },
    // RBAC service is the SINGLE SOURCE OF TRUTH for admin hierarchy + store-team roles.
    // Commerce is a Policy Enforcement Point: it forwards the caller's bearer token to
    // resolve their effective grants, and owns the country→store scope-chain resolution
    // (the RBAC PDP itself is store-unaware and matches scope by exact string).
    rbac: {
        baseUrl:       process.env.RBAC_BASE_URL || 'http://localhost:3055',
        apiPrefix:     process.env.RBAC_API_PREFIX || '/v1',
        timeoutMs:     Number(process.env.RBAC_TIMEOUT_MS || 4000),
        // 'closed' (default, secure): deny when RBAC is unreachable. 'open': last-resort degrade.
        failMode:      (process.env.RBAC_FAIL_MODE || 'closed').toLowerCase(),
        // Break-glass: honor a super_admin claim in the (RBAC-issued) JWT even if RBAC is
        // unreachable, so platform owners are never locked out. Narrow + auditable.
        breakglassSuperAdmin: process.env.RBAC_BREAKGLASS_SUPERADMIN !== 'false',
        // Optional system-context service key (header X-Internal-Key). Only used when no
        // caller token is available (background jobs). Empty = disabled.
        internalApiKey: process.env.RBAC_INTERNAL_API_KEY || '',
    },
};
