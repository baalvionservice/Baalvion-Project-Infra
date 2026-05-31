'use strict';
/**
 * @baalvion/cache — the shared Redis cache abstraction.
 *
 *   const { createCache, TTL } = require('@baalvion/cache');
 *   const cache = createCache({ namespace: 'fx', tenantScoped: true });
 *   const rate = await cache.getOrSet(['rate', 'USD/EUR'], fetchRate, { ttl: TTL.FX });
 */
const { Cache } = require('./cache');
const { createRedis } = require('./redis');
const { TTL } = require('./ttl');
const { buildKey, resolveTenant } = require('./keys');

function createCache(opts = {}) { return new Cache(opts); }

module.exports = { Cache, createCache, createRedis, TTL, buildKey, resolveTenant };
