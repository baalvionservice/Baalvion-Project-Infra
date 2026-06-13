'use strict';
const Redis = require('ioredis');
const config = require('../config/appConfig');

const client = new Redis({ host: config.redis.host, port: config.redis.port, password: config.redis.password, lazyConnect: true });
client.on('error', (err) => console.error('[Order Cache] Redis error:', err.message));

const keys = {
    order: (id) => `orders:order:${id}`,
    orderList: (storeId) => `orders:store:${storeId}:orders`,
    customer: (id) => `orders:customer:${id}`,
    customerList: (storeId) => `orders:store:${storeId}:customers`,
    cart: (id) => `orders:cart:${id}`,
};

const get = async (key) => { try { const v = await client.get(key); return v ? JSON.parse(v) : null; } catch { return null; } };
const set = async (key, value, ttl = 300) => { try { await client.set(key, JSON.stringify(value), 'EX', ttl); } catch {} };
const del = async (key) => { try { await client.del(key); } catch {} };
const delPattern = async (pattern) => { try { const keys = await client.keys(pattern); if (keys.length) await client.del(...keys); } catch {} };

module.exports = { get, set, del, delPattern, keys };
