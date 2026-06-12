'use strict';

/**
 * Raised when an operation is aborted via an AbortSignal mid-retry.
 */
class AbortError extends Error {
  constructor() {
    super('Operation aborted');
    this.name = 'AbortError';
    this.code = 'ABORTED';
  }
}

/** Default sleep that respects an optional AbortSignal. */
function defaultSleep(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal && signal.aborted) return reject(new AbortError());
    const timer = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          reject(new AbortError());
        },
        { once: true },
      );
    }
  });
}

/**
 * Retry an async operation with exponential backoff + full jitter.
 *
 * Full jitter (AWS-recommended) spreads retries across the window to avoid
 * thundering-herd retry storms when many callers fail at once.
 *
 * `sleep` and `random` are injectable so retries are deterministically
 * testable with zero real delay.
 *
 * @template T
 * @param {(attempt: number) => Promise<T>} fn  receives the 0-based attempt index
 * @param {object} [opts]
 * @param {number} [opts.retries] additional attempts after the first (default 3 → up to 4 calls)
 * @param {number} [opts.minDelayMs] base backoff (default 100)
 * @param {number} [opts.maxDelayMs] backoff ceiling (default 5000)
 * @param {number} [opts.factor] exponential multiplier (default 2)
 * @param {boolean} [opts.jitter] apply full jitter (default true)
 * @param {(err: unknown, attempt: number) => boolean} [opts.retryable] which errors retry
 * @param {(info: {attempt: number, delay: number, error: unknown}) => void} [opts.onRetry]
 * @param {AbortSignal} [opts.signal]
 * @param {(ms: number, signal?: AbortSignal) => Promise<void>} [opts.sleep] injectable for tests
 * @param {() => number} [opts.random] injectable for tests
 * @returns {Promise<T>}
 */
async function withRetry(fn, opts = {}) {
  const retries = opts.retries ?? 3;
  const minDelayMs = opts.minDelayMs ?? 100;
  const maxDelayMs = opts.maxDelayMs ?? 5000;
  const factor = opts.factor ?? 2;
  const jitter = opts.jitter !== false;
  const retryable = opts.retryable || (() => true);
  const onRetry = opts.onRetry || (() => {});
  const sleep = opts.sleep || defaultSleep;
  const random = opts.random || Math.random;

  let attempt = 0;
  for (;;) {
    if (opts.signal && opts.signal.aborted) throw new AbortError();
    try {
      return await fn(attempt);
    } catch (err) {
      attempt++;
      if (attempt > retries || !retryable(err, attempt)) throw err;
      const exp = Math.min(maxDelayMs, minDelayMs * factor ** (attempt - 1));
      const delay = jitter ? Math.round(random() * exp) : exp;
      onRetry({ attempt, delay, error: err });
      await sleep(delay, opts.signal);
    }
  }
}

module.exports = { withRetry, AbortError };
