'use strict';
const { createRedis } = require('./redis');
const { buildKey, resolveTenant } = require('./keys');
const { TTL } = require('./ttl');

/**
 * Redis-backed cache with the patterns every service needs:
 *  - getOrSet: read-through / write-through memoization
 *  - single-flight: concurrent misses for the same key run the loader ONCE
 *  - fail-open: if Redis is unreachable, fall through to the loader (never break the request)
 *  - tenant-scoped keys: optional, to prevent cross-tenant cache bleed
 *  - prefix invalidation
 *
 * `null` IS cached (cache-penetration protection); only `undefined` is never cached.
 */
class Cache {
    constructor(opts = {}) {
        this.namespace = opts.namespace || 'baalvion';
        this.defaultTtl = opts.defaultTtl ?? TTL.DEFAULT;
        this.tenantScoped = opts.tenantScoped ?? false;
        this.logger = opts.logger || console;
        this.client = opts.client || createRedis(opts.redis || {});
        this._inflight = new Map();
        this.stats = { hits: 0, misses: 0, errors: 0 };
    }

    key(parts, opts = {}) {
        const tenant = resolveTenant({ tenant: opts.tenant, tenantScoped: opts.tenantScoped ?? this.tenantScoped });
        return buildKey(this.namespace, parts, tenant);
    }

    async _getRaw(fullKey) {
        try { return await this.client.get(fullKey); }
        catch (err) { this.stats.errors++; this.logger.warn?.(`[cache] get failed (fail-open): ${err.message}`); return undefined; }
    }

    /** Convenience getter — returns the cached value or null (absent + cached-null both → null). */
    async get(parts, opts = {}) {
        const raw = await this._getRaw(this.key(parts, opts));
        if (raw == null) return null;
        try { return JSON.parse(raw); } catch { return null; }
    }

    /** ttl<=0 → persist without expiry. Fail-open (returns false on Redis error). */
    async set(parts, value, ttl, opts = {}) {
        if (value === undefined) return false;
        const fullKey = this.key(parts, opts);
        const payload = JSON.stringify(value);
        const t = ttl ?? this.defaultTtl;
        try {
            if (t > 0) await this.client.set(fullKey, payload, 'EX', t);
            else await this.client.set(fullKey, payload);
            return true;
        } catch (err) { this.stats.errors++; this.logger.warn?.(`[cache] set failed: ${err.message}`); return false; }
    }

    async del(parts, opts = {}) {
        try { return await this.client.del(this.key(parts, opts)); }
        catch (err) { this.stats.errors++; return 0; }
    }

    /**
     * Read-through + single-flight. On miss, runs `loader` once (even under
     * concurrency), caches the result, and returns it. Fail-open on Redis errors.
     */
    async getOrSet(parts, loader, opts = {}) {
        const fullKey = this.key(parts, opts);
        const raw = await this._getRaw(fullKey);
        if (raw != null) {
            this.stats.hits++;
            try { return JSON.parse(raw); } catch { /* fall through to reload */ }
        } else if (raw === null) {
            this.stats.misses++;
        }

        // single-flight: dedupe concurrent misses for the same key within this process
        if (this._inflight.has(fullKey)) return this._inflight.get(fullKey);

        const ttl = opts.ttl ?? this.defaultTtl;
        const promise = (async () => {
            const value = await loader();
            await this.set(parts, value, ttl, opts); // best-effort; fail-open
            return value;
        })().finally(() => this._inflight.delete(fullKey));

        this._inflight.set(fullKey, promise);
        return promise;
    }

    /** Wrap a loader fn into a memoized fn. keyFn(args) → key parts. */
    wrap(loader, { ttl, keyFn, tenantScoped } = {}) {
        return (...args) => {
            const parts = keyFn ? keyFn(...args) : args;
            return this.getOrSet(parts, () => loader(...args), { ttl, tenantScoped });
        };
    }

    /** Invalidate every key under a prefix (e.g. after a write). Returns count removed. */
    async invalidatePrefix(parts, opts = {}) {
        const prefix = this.key(parts, opts);
        const pattern = `${prefix}*`;
        let cursor = '0';
        let removed = 0;
        try {
            do {
                const [next, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 200);
                cursor = next;
                if (keys.length) { await this.client.del(...keys); removed += keys.length; }
            } while (cursor !== '0');
        } catch (err) { this.stats.errors++; this.logger.warn?.(`[cache] invalidatePrefix failed: ${err.message}`); }
        return removed;
    }

    async ttlOf(parts, opts = {}) {
        try { return await this.client.pttl(this.key(parts, opts)); }
        catch { return -2; }
    }

    async ping() { try { return (await this.client.ping()) === 'PONG'; } catch { return false; } }
    async close() { try { await this.client.quit(); } catch { try { this.client.disconnect(); } catch { /* */ } } }
}

module.exports = { Cache };
