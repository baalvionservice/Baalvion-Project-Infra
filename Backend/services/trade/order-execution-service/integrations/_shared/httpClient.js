'use strict';
/**
 * Production HTTP client shared by all real vendor adapters.
 *
 * Built on global fetch (Node 18+, already used by the service's existing
 * paymentClient/sanctionsClient). Zero dependencies on purpose — adapters stay
 * thin and auditable.
 *
 * Guarantees:
 *  - hard per-attempt timeout via AbortController (never hangs a worker)
 *  - bounded retries with exponential backoff + full jitter
 *  - retries ONLY safe/declared-retriable conditions (network error, timeout,
 *    429, 5xx) and ONLY when the caller opts in (idempotent calls), so a
 *    money-moving POST is never silently re-sent
 *  - typed errors so adapters can map to their contract FAILURE_MODES
 *  - never logs request/response bodies (they carry PII / secrets)
 */

class IntegrationHttpError extends Error {
    constructor(message, { status, code, retriable = false, body } = {}) {
        super(message);
        this.name = 'IntegrationHttpError';
        this.status = status;
        this.code = code;
        this.retriable = retriable;
        // The vendor response body may carry PII / secrets. Keep it programmatically
        // accessible (err.body) but NON-ENUMERABLE so a structured logger that
        // JSON.stringify's the error never serializes it. Use toSafeLog() to log.
        Object.defineProperty(this, 'body', {
            value: body,
            enumerable: false,
            writable: true,
            configurable: true,
        });
    }

    /** Safe subset for logging — never includes the vendor body. */
    toSafeLog() {
        return { name: this.name, message: this.message, status: this.status, code: this.code };
    }
}

class IntegrationTimeoutError extends Error {
    constructor(message) {
        super(message);
        this.name = 'IntegrationTimeoutError';
        this.retriable = true;
    }
}

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_RETRIES = 0; // opt-in; money POSTs must keep this 0
const RETRIABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const DEFAULT_MAX_RESPONSE_BYTES = 2_000_000; // 2MB cap — guards a hostile/runaway upstream

/**
 * Resolve the max response-body size: explicit opt wins, else MAX_RESPONSE_BYTES
 * env, else the 2MB default. A non-finite/<=0 override falls back to the default.
 */
function resolveMaxResponseBytes(opt) {
    const fromOpt = Number(opt);
    if (Number.isFinite(fromOpt) && fromOpt > 0) return fromOpt;
    const fromEnv = Number(process.env.MAX_RESPONSE_BYTES);
    if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
    return DEFAULT_MAX_RESPONSE_BYTES;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Full-jitter exponential backoff. `attempt` is 1-based.
 * Deterministic when `rng` is injected (tests pass a fixed rng).
 */
function backoffMs(attempt, { baseMs = 200, maxMs = 5000, rng = Math.random } = {}) {
    const ceiling = Math.min(maxMs, baseMs * 2 ** (attempt - 1));
    return Math.floor(rng() * ceiling);
}

/**
 * Perform an HTTP request with timeout + optional bounded retry.
 *
 * @param {Object} opts
 * @param {string} opts.url
 * @param {string} [opts.method='GET']
 * @param {Object} [opts.headers]
 * @param {string|Buffer} [opts.body]            already-serialized body
 * @param {number} [opts.timeoutMs]
 * @param {number} [opts.retries]                additional attempts after the first
 * @param {number} [opts.baseMs] [opts.maxMs]    backoff tuning
 * @param {(n:number)=>number} [opts.rng]        injectable RNG (tests)
 * @param {typeof fetch} [opts.fetchImpl]        injectable fetch (tests)
 * @param {boolean} [opts.parseJson=true]
 * @returns {Promise<{ status:number, headers:Headers, json:any, text:string }>}
 * @throws {IntegrationHttpError|IntegrationTimeoutError}
 */
async function request(opts) {
    const {
        url,
        method = 'GET',
        headers = {},
        body,
        timeoutMs = DEFAULT_TIMEOUT_MS,
        retries = DEFAULT_RETRIES,
        baseMs,
        maxMs,
        rng,
        fetchImpl = globalThis.fetch,
        parseJson = true,
        maxResponseBytes,
    } = opts;

    if (typeof fetchImpl !== 'function') {
        throw new IntegrationHttpError('no fetch implementation available', { code: 'NO_FETCH' });
    }

    const maxBytes = resolveMaxResponseBytes(maxResponseBytes);

    const totalAttempts = 1 + Math.max(0, retries);
    let lastErr;

    for (let attempt = 1; attempt <= totalAttempts; attempt += 1) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const res = await fetchImpl(url, { method, headers, body, signal: controller.signal });
            // Cap the body size: reject upfront if content-length advertises over the
            // cap, then backstop on the actual decoded length (length lies / chunked).
            assertWithinCap(res, maxBytes, url);
            const text = await res.text();
            if (typeof text === 'string' && text.length > maxBytes) {
                throw new IntegrationHttpError(
                    `response body from ${safeHost(url)} exceeds ${maxBytes} bytes`,
                    { code: 'RESPONSE_TOO_LARGE', status: res.status },
                );
            }
            if (!res.ok) {
                const retriable = RETRIABLE_STATUS.has(res.status);
                const err = new IntegrationHttpError(`HTTP ${res.status} from ${safeHost(url)}`, {
                    status: res.status,
                    retriable,
                    body: parseJson ? safeJson(text) : text,
                });
                if (retriable && attempt < totalAttempts) { lastErr = err; await backoff(attempt, baseMs, maxMs, rng); continue; }
                throw err;
            }
            return { status: res.status, headers: res.headers, json: parseJson ? safeJson(text) : undefined, text };
        } catch (err) {
            const isAbort = err && (err.name === 'AbortError');
            const wrapped = isAbort ? new IntegrationTimeoutError(`timeout after ${timeoutMs}ms calling ${safeHost(url)}`) : err;
            const retriable = isAbort || (err && err.retriable) || isNetworkError(err);
            if (retriable && attempt < totalAttempts) { lastErr = wrapped; await backoff(attempt, baseMs, maxMs, rng); continue; }
            throw wrapped;
        } finally {
            clearTimeout(timer);
        }
    }
    throw lastErr;
}

async function backoff(attempt, baseMs, maxMs, rng) {
    await sleep(backoffMs(attempt, { baseMs, maxMs, rng }));
}

/**
 * Reject a response whose advertised Content-Length exceeds the cap, before we
 * read the body into memory. `res.headers.get` exists on a real Headers object
 * and on the Map used by tests.
 */
function assertWithinCap(res, maxBytes, url) {
    const headers = res && res.headers;
    let raw;
    if (headers && typeof headers.get === 'function') raw = headers.get('content-length');
    if (raw == null && headers && typeof headers === 'object' && 'content-length' in headers) {
        raw = headers['content-length'];
    }
    if (raw == null) return;
    const len = Number(raw);
    if (Number.isFinite(len) && len > maxBytes) {
        throw new IntegrationHttpError(
            `response body from ${safeHost(url)} exceeds ${maxBytes} bytes (content-length ${len})`,
            { code: 'RESPONSE_TOO_LARGE', status: res.status },
        );
    }
}

function isNetworkError(err) {
    // fetch throws TypeError on DNS/conn failures; treat as retriable transport errors.
    return err && err.name === 'TypeError';
}

function safeJson(text) {
    if (!text) return undefined;
    try { return JSON.parse(text); } catch { return undefined; }
}

/** Host only — never leak full URLs (may carry tokens in query). */
function safeHost(url) {
    try { return new URL(url).host; } catch { return 'upstream'; }
}

module.exports = {
    request,
    backoffMs,
    IntegrationHttpError,
    IntegrationTimeoutError,
    RETRIABLE_STATUS,
};
