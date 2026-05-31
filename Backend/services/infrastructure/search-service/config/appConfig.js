'use strict';
const dotenv = require('dotenv');
dotenv.config();

const parseList = (v, fb = []) => (!v ? fb : v.split(',').map((s) => s.trim()).filter(Boolean));

module.exports = {
    env:         process.env.NODE_ENV || 'development',
    port:        Number(process.env.PORT || 3036),
    apiVersion:  'v1',
    corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000', 'http://localhost:3030', 'http://localhost:8080']),

    // @baalvion/search reads OPENSEARCH_URL/USER/PASS from env directly; mirrored here for /health.
    opensearch: {
        url:  process.env.OPENSEARCH_URL || 'http://localhost:9200',
        user: process.env.OPENSEARCH_USER || '',
    },

    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-insecure-search-secret',
        issuer:       process.env.JWT_ISSUER   || 'baalvion-auth',
        audience:     process.env.JWT_AUDIENCE || 'baalvion-platform',
    },

    // Shared secret for service-to-service indexing (producers → POST /v1/index/...).
    internalApiKey: process.env.INTERNAL_API_KEY || '',
};
