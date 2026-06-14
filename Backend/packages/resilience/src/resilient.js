'use strict';

const { CircuitBreaker } = require('./circuit-breaker');
const { withRetry } = require('./retry');
const { withTimeout } = require('./timeout');
const { Bulkhead } = require('./bulkhead');

/**
 * Compose all resilience primitives into a single wrapped callable.
 *
 * Layering (outer → inner):
 *   bulkhead  → caps total in-flight calls (protects the whole service)
 *     retry   → re-attempts transient failures with backoff + jitter
 *       breaker → trips after repeated failures so retries fail fast
 *         timeout → bounds each individual attempt
 *           fn  → your operation
 *
 * The breaker sits *inside* retry so a tripped circuit short-circuits the
 * remaining retries instead of hammering a dead dependency.
 *
 * @template T
 * @param {(...args: any[]) => Promise<T>} fn
 * @param {object} [opts]
 * @param {object|false} [opts.circuitBreaker] CircuitBreaker opts, or false to disable
 * @param {object|false} [opts.retry] withRetry opts, or false to disable
 * @param {number} [opts.timeoutMs] per-attempt deadline (omit to disable)
 * @param {object|Bulkhead|false} [opts.bulkhead] Bulkhead opts/instance, or false to disable
 * @returns {(...args: any[]) => Promise<T>} & { breaker?: CircuitBreaker, bulkhead?: Bulkhead }
 */
function createResilient(fn, opts = {}) {
  const breaker = opts.circuitBreaker === false ? null : new CircuitBreaker(opts.circuitBreaker || {});
  const bulkhead =
    opts.bulkhead === false
      ? null
      : opts.bulkhead instanceof Bulkhead
        ? opts.bulkhead
        : new Bulkhead(opts.bulkhead || {});

  const wrapped = async (...args) => {
    const attempt = () =>
      opts.timeoutMs
        ? withTimeout((signal) => fn(...args, signal), opts.timeoutMs)
        : fn(...args);

    const guarded = breaker ? () => breaker.exec(attempt) : attempt;

    const run = () => (opts.retry === false ? guarded() : withRetry(guarded, opts.retry || {}));

    return bulkhead ? bulkhead.exec(run) : run();
  };

  // Expose the breaker/bulkhead so callers can read state for metrics.
  if (breaker) wrapped.breaker = breaker;
  if (bulkhead) wrapped.bulkhead = bulkhead;
  return wrapped;
}

module.exports = { createResilient };
