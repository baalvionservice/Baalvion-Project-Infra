'use strict';

/**
 * Thrown when an operation exceeds its deadline. Maps to 504 at the boundary.
 */
class TimeoutError extends Error {
  constructor(ms) {
    super(`Operation timed out after ${ms}ms`);
    this.name = 'TimeoutError';
    this.code = 'TIMEOUT';
    this.statusCode = 504;
  }
}

/**
 * Run `fn` with a hard deadline. `fn` receives an AbortSignal so a
 * cooperating operation (fetch, pg query with a cancel hook, …) can stop
 * work instead of leaking once the deadline passes.
 *
 * @template T
 * @param {(signal: AbortSignal) => Promise<T>} fn
 * @param {number} ms deadline in milliseconds
 * @param {object} [opts]
 * @param {AbortSignal} [opts.signal] caller signal; aborting it aborts the op
 * @param {() => void} [opts.onTimeout]
 * @returns {Promise<T>}
 */
async function withTimeout(fn, ms, opts = {}) {
  const controller = new AbortController();
  const onParentAbort = () => controller.abort();
  if (opts.signal) {
    if (opts.signal.aborted) controller.abort();
    else opts.signal.addEventListener('abort', onParentAbort, { once: true });
  }

  let timer;
  const deadline = new Promise((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      (opts.onTimeout || (() => {}))();
      reject(new TimeoutError(ms));
    }, ms);
  });

  try {
    const op = Promise.resolve(fn(controller.signal));
    // If the deadline wins the race, the operation keeps running and may reject
    // asynchronously (e.g. after it notices the abort) with no handler attached
    // — which would surface as an unhandled rejection and crash the process.
    // Swallow that trailing rejection; the caller already got TimeoutError.
    op.catch(() => {});
    return await Promise.race([op, deadline]);
  } finally {
    clearTimeout(timer);
    if (opts.signal) opts.signal.removeEventListener('abort', onParentAbort);
  }
}

module.exports = { withTimeout, TimeoutError };
