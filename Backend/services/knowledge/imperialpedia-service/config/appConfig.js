const dotenv = require('dotenv');
dotenv.config();
const parseList = (v, f = []) => v ? v.split(',').map(s => s.trim()).filter(Boolean) : f;
module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3004),
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
    security: { ipRateLimit: Number(process.env.RATE_LIMIT_IP_MAX || 120) },
    internalSecret: require('@baalvion/auth-node').requireEnv('INTERNAL_SERVICE_SECRET'),
    cms: { baseUrl: process.env.CMS_BASE_URL || 'http://localhost:3018/api/v1' },
    eventBus: {
        consumerGroup: 'imperialpedia-service',
        allowedWebsiteSlugs: parseList(process.env.GLOSSARY_SYNC_WEBSITE_SLUGS, ['imperialpedia']),
    },
    glossarySync: { maxWords: Number(process.env.GLOSSARY_SYNC_MAX_WORDS || 2) },
    entityLinking: {
        // First-occurrence-only / one link per entity is a hard anti-spam rule
        // (see service/entityMentionDetectionService.js), not a tunable — only
        // the overall per-article cap is configurable.
        maxLinksPerArticle: Number(process.env.ENTITY_LINK_MAX_PER_ARTICLE || 15),
    },
};
