'use strict';

/**
 * Retry policy for SES sends.
 *
 *  - TRANSIENT failures (throttling, timeouts, 5xx, network resets) are retried with
 *    exponential backoff + jitter.
 *  - PERMANENT failures (MessageRejected, invalid address, account paused, and anything
 *    that corresponds to a HARD BOUNCE / 4xx validation error) are NEVER retried — retrying
 *    a hard bounce only wastes the sending quota and damages reputation.
 */

const DEFAULTS = {
    maxAttempts: Number(process.env.SES_MAX_ATTEMPTS || 3),
    baseDelayMs: Number(process.env.SES_RETRY_BASE_MS || 500),
    maxDelayMs: Number(process.env.SES_RETRY_MAX_MS || 8000),
};

// SES / AWS SDK error names that are permanent — sending again will deterministically fail.
const PERMANENT_ERRORS = new Set([
    'MessageRejected',            // e.g. address on the account suppression list (prior hard bounce)
    'MailFromDomainNotVerifiedException',
    'AccountSuspendedException',
    'SendingPausedException',
    'BadRequestException',
    'NotFoundException',
    'LimitExceededException',     // resource limit (not a rate limit) — config error, not transient
]);

// Explicitly transient AWS SDK error names.
const TRANSIENT_ERRORS = new Set([
    'ThrottlingException',
    'TooManyRequestsException',
    'Throttling',
    'RequestTimeout',
    'RequestTimeoutException',
    'TimeoutError',
    'InternalServiceErrorException',
    'ServiceUnavailableException',
    'ServiceUnavailable',
    'ECONNRESET',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'EPIPE',
]);

/**
 * @param {unknown} err
 * @returns {boolean} true when the failure is worth retrying
 */
function isTransient(err) {
    if (!err || typeof err !== 'object') return false;
    const name = err.name || err.code || '';
    if (PERMANENT_ERRORS.has(name)) return false;
    if (TRANSIENT_ERRORS.has(name)) return true;

    // HTTP status heuristics from the AWS SDK v3 metadata.
    const status = err.$metadata && err.$metadata.httpStatusCode;
    if (typeof status === 'number') {
        if (status === 429) return true;          // throttled
        if (status >= 500) return true;           // server-side, retryable
        if (status >= 400 && status < 500) return false; // client error → permanent
    }
    // The SDK also flags retryability on the fault.
    if (err.$retryable) return true;
    return false;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Run `fn` with bounded retries on transient errors only.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ maxAttempts?: number, baseDelayMs?: number, maxDelayMs?: number, onRetry?: (info:{attempt:number,delay:number,error:unknown})=>void }} [opts]
 * @returns {Promise<T>}
 */
async function withRetry(fn, opts = {}) {
    const cfg = { ...DEFAULTS, ...opts };
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        attempt += 1;
        try {
            return await fn();
        } catch (err) {
            const lastAttempt = attempt >= cfg.maxAttempts;
            if (lastAttempt || !isTransient(err)) {
                throw err;
            }
            // Exponential backoff with full jitter, capped.
            const exp = Math.min(cfg.maxDelayMs, cfg.baseDelayMs * 2 ** (attempt - 1));
            const delay = Math.floor(Math.random() * exp);
            if (typeof cfg.onRetry === 'function') {
                cfg.onRetry({ attempt, delay, error: err });
            }
            await sleep(delay);
        }
    }
}

module.exports = { withRetry, isTransient, PERMANENT_ERRORS, TRANSIENT_ERRORS, DEFAULTS };
