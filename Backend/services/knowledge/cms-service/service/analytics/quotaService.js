'use strict';
/**
 * Cost & quota governance for external provider APIs.
 *
 * Each provider gets a per-website daily API-call budget tracked in Redis. Before
 * a connector calls its provider, the sync runtime consumes one unit; once the
 * budget is exhausted the sync is skipped and the dashboard falls back to the last
 * cached provider_metrics ("degraded mode"). Fail-open: a Redis error never blocks
 * a sync (we'd rather spend a little quota than stall data).
 */
const { getRedis } = require('./redisClient');

// Conservative daily call budgets per provider (override via env ANALYTICS_QUOTA_<PROVIDER>).
const DEFAULT_BUDGET = {
    ga4: 5000,
    gsc: 1200,
    'google-ads': 1000,
    adsense: 1000,
    'meta-pixel': 200,
    'tiktok-pixel': 200,
    linkedin: 200,
    cloudflare: 500,
    clarity: 300,
    internal_cms: 100000, // internal, effectively unlimited
};

function budgetFor(provider) {
    const envKey = `ANALYTICS_QUOTA_${provider.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
    return Number(process.env[envKey] || DEFAULT_BUDGET[provider] || 500);
}

/**
 * Consume one call unit for (provider, website) today. Returns
 * { allowed, used, budget }. allowed=false means the budget is spent → skip sync.
 */
async function consume(provider, websiteId) {
    const budget = budgetFor(provider);
    const day = new Date().toISOString().slice(0, 10);
    const key = `an:quota:${provider}:${websiteId}:${day}`;
    try {
        const used = await getRedis().incr(key);
        if (used === 1) await getRedis().expire(key, 90000); // ~25h
        return { allowed: used <= budget, used, budget };
    } catch {
        return { allowed: true, used: 0, budget }; // fail-open
    }
}

module.exports = { consume, budgetFor, DEFAULT_BUDGET };
