'use strict';
const { Client } = require('@elastic/elasticsearch');

const ENABLED = !!(process.env.ES_URL || process.env.ELASTICSEARCH_URL);
const NODE    = process.env.ES_URL || process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

let client = null;

if (ENABLED) {
    client = new Client({
        node: NODE,
        ...(process.env.ES_API_KEY ? { auth: { apiKey: process.env.ES_API_KEY } } : {}),
        ...(process.env.ES_USERNAME ? {
            auth: { username: process.env.ES_USERNAME, password: process.env.ES_PASSWORD || '' }
        } : {}),
        requestTimeout: 10000,
    });

    client.ping()
        .then(() => console.log('[Elasticsearch] Connected to', NODE))
        .catch(err => console.warn('[Elasticsearch] Not reachable —', err.message, '(search will fall back to DB)'));
} else {
    console.log('[Elasticsearch] Not configured — search will use DB full-text');
}

const JOB_INDEX = process.env.ES_JOB_INDEX || 'baalvion-jobs';

module.exports = { client, ENABLED, JOB_INDEX };
