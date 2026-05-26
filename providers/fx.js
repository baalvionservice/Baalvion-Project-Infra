'use strict';
/**
 * FX provider with a real live source (Frankfurter / ECB, no API key required)
 * and a deterministic static fallback. Implements a fast-fail timeout (circuit
 * breaker) so a slow/unavailable provider degrades gracefully instead of hanging.
 *
 * Env:
 *   FX_MODE = 'live' (default) | 'static'
 *   FX_PROVIDER_URL (optional override; default https://api.frankfurter.app)
 *   FX_TIMEOUT_MS (default 3000)
 */
const BASE_URL = process.env.FX_PROVIDER_URL || 'https://api.frankfurter.app';
const TIMEOUT_MS = Number(process.env.FX_TIMEOUT_MS || 3000);
const MODE = (process.env.FX_MODE || 'live').toLowerCase();

// Static fallback corridor (mid-market approximations).
const STATIC = {
    USD_EUR: 0.92, USD_INR: 83.45, USD_SGD: 1.35, USD_CNY: 7.24, USD_AED: 3.67,
    EUR_USD: 1.09, INR_USD: 0.012, SGD_USD: 0.74, CNY_USD: 0.138, AED_USD: 0.272,
};

// Lightweight circuit breaker: after N consecutive failures, skip live calls
// for a cooldown window so we don't repeatedly pay the timeout.
const breaker = { failures: 0, openUntil: 0, threshold: 3, cooldownMs: 30000 };

function staticRate(base, target, reason) {
    const direct = STATIC[`${base}_${target}`];
    const inverse = STATIC[`${target}_${base}`];
    const rate = direct ?? (inverse ? Number((1 / inverse).toFixed(6)) : 1);
    return { base, target, rate, source: 'static-fallback', live: false, ...(reason ? { fallbackReason: reason } : {}) };
}

async function fetchLiveRate(base, target) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
        const res = await fetch(`${BASE_URL}/latest?from=${base}&to=${target}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`fx_http_${res.status}`);
        const json = await res.json();
        const rate = json && json.rates && json.rates[target];
        if (!rate) throw new Error('fx_no_rate');
        return { base, target, rate, source: 'frankfurter', live: true, asOf: json.date };
    } finally {
        clearTimeout(timer);
    }
}

async function getRate(base, target) {
    base = String(base || '').toUpperCase();
    target = String(target || '').toUpperCase();
    if (!base || !target) throw new Error('base and target are required');
    if (base === target) return { base, target, rate: 1, source: 'identity', live: true };

    if (MODE === 'static') return staticRate(base, target);
    if (Date.now() < breaker.openUntil) return staticRate(base, target, 'circuit_open');

    try {
        const result = await fetchLiveRate(base, target);
        breaker.failures = 0;
        return result;
    } catch (e) {
        breaker.failures += 1;
        if (breaker.failures >= breaker.threshold) breaker.openUntil = Date.now() + breaker.cooldownMs;
        return staticRate(base, target, e.message);
    }
}

async function convert(base, target, amount) {
    const q = await getRate(base, target);
    return { ...q, amount: Number(amount), converted: Number((Number(amount) * q.rate).toFixed(2)) };
}

async function health() {
    if (MODE === 'static') return { name: 'fx', provider: 'static', mode: MODE, healthy: true };
    try {
        const r = await getRate('USD', 'EUR');
        return { name: 'fx', provider: 'frankfurter', mode: MODE, healthy: r.live, degraded: !r.live, circuitOpen: Date.now() < breaker.openUntil };
    } catch (e) {
        return { name: 'fx', provider: 'frankfurter', mode: MODE, healthy: false, error: e.message };
    }
}

module.exports = { getRate, convert, health };
