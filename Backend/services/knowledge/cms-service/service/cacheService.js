'use strict';
const Redis = require('ioredis');
const config = require('../config/appConfig');
const { logger } = require('../platform/logger');

let client = null;

function getClient() {
    if (!client) {
        client = new Redis({ host: config.redis.host, port: config.redis.port, password: config.redis.password || undefined, lazyConnect: true });
        client.on('error', (err) => logger('cache').error({ err: err && err.message }, 'redis error'));
    }
    return client;
}

async function get(key) {
    try {
        const val = await getClient().get(key);
        return val ? JSON.parse(val) : null;
    } catch (err) {
        // Fail open (fall through to DB), but make the failure observable — a
        // silent JSON.parse error here would otherwise hide cache corruption.
        logger('cache').warn({ key, err: err && err.message }, 'cache get failed');
        return null;
    }
}

async function set(key, value, ttlSeconds) {
    try {
        await getClient().set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
        // Non-fatal — cache miss on next request
    }
}

async function del(key) {
    try {
        await getClient().del(key);
    } catch { /* ignore */ }
}

async function delPattern(pattern) {
    try {
        const keys = await getClient().keys(pattern);
        if (keys.length > 0) await getClient().del(...keys);
    } catch { /* ignore */ }
}

const keys = {
    websiteList: (orgId) => `cms:websites:org:${orgId}`,
    website: (id) => `cms:website:${id}`,
    categoryTree: (websiteId) => `cms:categories:${websiteId}`,
    tagList: (websiteId) => `cms:tags:${websiteId}`,
    content: (id) => `cms:content:${id}`,
    contentList: (websiteId, page) => `cms:contents:${websiteId}:p${page}`,
    publicContent: (websiteSlug, slug) => `cms:public:${websiteSlug}:${slug}`,
    publicList: (websiteSlug, page) => `cms:public:${websiteSlug}:list:p${page}`,
};

module.exports = { get, set, del, delPattern, keys };
