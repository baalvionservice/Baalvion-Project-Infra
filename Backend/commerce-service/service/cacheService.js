'use strict';
const Redis = require('ioredis');
const config = require('../config/appConfig');
let client = null;
function getClient() {
    if (!client) { client = new Redis({ host: config.redis.host, port: config.redis.port, password: config.redis.password || undefined, lazyConnect: true }); client.on('error', (err) => console.error('[Commerce Cache]', err.message)); }
    return client;
}
async function get(key) { try { const v = await getClient().get(key); return v ? JSON.parse(v) : null; } catch { return null; } }
async function set(key, value, ttl) { try { await getClient().set(key, JSON.stringify(value), 'EX', ttl); } catch {} }
async function del(key) { try { await getClient().del(key); } catch {} }
async function delPattern(pattern) { try { const keys = await getClient().keys(pattern); if (keys.length) await getClient().del(...keys); } catch {} }
const keys = {
    store: (id) => `commerce:store:${id}`,
    storeList: (orgId) => `commerce:stores:org:${orgId}`,
    categoryTree: (storeId) => `commerce:categories:${storeId}`,
    product: (id) => `commerce:product:${id}`,
    productList: (storeId, p) => `commerce:products:${storeId}:p${p}`,
    collectionList: (storeId) => `commerce:collections:${storeId}`,
    discountList: (storeId) => `commerce:discounts:${storeId}`,
};
module.exports = { get, set, del, delPattern, keys };
