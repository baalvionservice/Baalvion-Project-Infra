'use strict';

/**
 * Circuit breaker middleware using opossum.
 *
 * NOTE: opossum is listed in devDependencies. Import this module only in
 * environments where the package is installed (dev / staging / prod with
 * devDependencies included in the Docker build).
 */

const CircuitBreaker = require('opossum');

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * createBreaker — wraps an async function with a circuit breaker.
 *
 * @param {Function} fn       - Async function to protect (receives the args
 *                              passed to breaker.fire(...))
 * @param {Object}  [options] - Opossum options (merged with defaults)
 * @returns {CircuitBreaker}
 */
function createBreaker(fn, options = {}) {
    const defaults = {
        timeout: 5000,                  // ms before a call is considered failed
        errorThresholdPercentage: 50,   // % failures before opening
        resetTimeout: 30000,            // ms before attempting half-open
    };

    const breaker = new CircuitBreaker(fn, { ...defaults, ...options });

    // Metrics via console — swap for a real metrics sink (prom-client, etc.)
    breaker.on('open', () =>
        console.warn(`[circuit-breaker] OPEN  — ${breaker.name || fn.name || 'unknown'}`),
    );
    breaker.on('close', () =>
        console.info(`[circuit-breaker] CLOSE — ${breaker.name || fn.name || 'unknown'}`),
    );
    breaker.on('halfOpen', () =>
        console.info(`[circuit-breaker] HALF-OPEN — ${breaker.name || fn.name || 'unknown'}`),
    );
    breaker.on('fallback', (result) =>
        console.info(`[circuit-breaker] FALLBACK — ${breaker.name || fn.name || 'unknown'}`, result),
    );

    return breaker;
}

// ---------------------------------------------------------------------------
// Pre-built breakers — each wraps a bare fetch() call so callers can do:
//   authServiceBreaker.fire(url, init)
// ---------------------------------------------------------------------------

const authServiceBreaker = createBreaker(
    async (url, init = {}) => {
        const res = await fetch(url, init);
        if (!res.ok) throw new Error(`auth-service ${res.status}`);
        return res;
    },
    { name: 'auth-service' },
);

const dashboardServiceBreaker = createBreaker(
    async (url, init = {}) => {
        const res = await fetch(url, init);
        if (!res.ok) throw new Error(`dashboard-service ${res.status}`);
        return res;
    },
    { name: 'dashboard-service' },
);

const realtimeServiceBreaker = createBreaker(
    async (url, init = {}) => {
        const res = await fetch(url, init);
        if (!res.ok) throw new Error(`realtime-service ${res.status}`);
        return res;
    },
    { name: 'realtime-service' },
);

// ---------------------------------------------------------------------------
// Express middleware factory
// ---------------------------------------------------------------------------

/**
 * breakerMiddleware — wraps a circuit breaker into an Express middleware.
 *
 * Usage:
 *   router.get('/proxy-auth', breakerMiddleware(authServiceBreaker), handler);
 *
 * The breaker is fired with (req, res) as arguments; the downstream handler
 * receives control only if the breaker succeeds.  On failure the middleware
 * responds 503 immediately.
 *
 * @param {CircuitBreaker} breaker
 * @returns {import('express').RequestHandler}
 */
function breakerMiddleware(breaker) {
    return async (req, res, next) => {
        try {
            await breaker.fire(req, res);
            next();
        } catch (err) {
            if (res.headersSent) return;
            res.status(503).json({
                error: 'service_unavailable',
                retryAfter: 30,
            });
        }
    };
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
    createBreaker,
    authServiceBreaker,
    dashboardServiceBreaker,
    realtimeServiceBreaker,
    breakerMiddleware,
};
