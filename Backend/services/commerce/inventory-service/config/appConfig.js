const dotenv = require('dotenv');
dotenv.config();
const parseList = (v, f = []) => v ? v.split(',').map(s => s.trim()).filter(Boolean) : f;
module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3014),
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000', 'http://localhost:3030', 'http://localhost:5173']),
    jwt: {
        publicKey: require('@baalvion/auth-node').requireEnv('JWT_PUBLIC_KEY').replace(/\\n/g, '\n'),
        issuer:    process.env.JWT_ISSUER   || 'baalvion-auth',
        audience:  process.env.JWT_AUDIENCE || 'baalvion-platform',
        jwksUri:   process.env.JWKS_URI     || null,
    },
    db: { host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 5432), name: process.env.DB_NAME || 'baalvion_db', user: process.env.DB_USER || 'baalvion', password: process.env.DB_PASSWORD || '', schema: 'inventory' },
    redis: { host: process.env.REDIS_HOST || 'localhost', port: Number(process.env.REDIS_PORT || 6379), password: process.env.REDIS_PASSWORD || undefined },
    cache: {
        rbacEffectiveTtl: Number(process.env.CACHE_RBAC_EFFECTIVE_TTL || 30),
        rbacScopeTtl: Number(process.env.CACHE_RBAC_SCOPE_TTL || 300),
    },
    security: { ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 200) },
    // Internal service-to-service key for committing operations a shopper must never invoke (the
    // reservation `confirm` endpoint commits stock without payment). Must match order-service's
    // INVENTORY_INTERNAL_KEY. When empty (dev), confirm falls back to requiring the ops_manager RBAC
    // chain (still never anonymous-open). RECOMMENDED in production.
    internal: { key: process.env.INVENTORY_INTERNAL_KEY || '' },
    // RBAC is the single source of truth; this service is a PEP via @baalvion/commerce-rbac.
    rbac: {
        baseUrl:       process.env.RBAC_BASE_URL || 'http://localhost:3055',
        apiPrefix:     process.env.RBAC_API_PREFIX || '/v1',
        timeoutMs:     Number(process.env.RBAC_TIMEOUT_MS || 4000),
        failMode:      (process.env.RBAC_FAIL_MODE || 'closed').toLowerCase(),
        breakglassSuperAdmin: process.env.RBAC_BREAKGLASS_SUPERADMIN !== 'false',
        internalApiKey: process.env.RBAC_INTERNAL_API_KEY || '',
    },
};
