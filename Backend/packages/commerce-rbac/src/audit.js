'use strict';
// Structured audit emission for the commerce RBAC PEP. Two sinks, both non-blocking and
// fail-open (auditing must NEVER break or slow a request):
//   1. stdout as a single-line JSON record — the guaranteed, log-aggregation-friendly sink.
//   2. durable-ish publish to the `baalvion:events` Redis stream, consumed by audit-service.
//
// The stream path used to be a single `xadd().catch(() => {})`: one transient Redis blip and the
// audit-service's queryable record was lost SILENTLY. It now retries with bounded backoff, and if
// it still can't deliver, it logs a LOUD structured `auditDeliveryFailed` line carrying the FULL
// event — so the record is still recoverable from the log pipeline and the drop is observable
// (alertable), never silent. The request path is still never blocked or failed.
//
// Event types: commerce.access_denied, commerce.cross_scope_attempt, commerce.rbac_breakglass.
// (Role changes are audited at the source of truth — rbac-service — not here.)

const STREAM_KEY = 'baalvion:events';
const DEFAULT_STREAM_RETRIES = 3;
const DEFAULT_STREAM_BACKOFF_MS = 50;
const MAX_STREAM_BACKOFF_MS = 2000;

function nowIso(clock) {
    // `clock` is injectable so tests are deterministic (no Date.now in the hot path otherwise).
    return clock ? clock() : new Date().toISOString();
}

function defaultSleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Deliver one audit event to the Redis stream with bounded exponential-backoff retry. Resolves to
 * true on success, false once retries are exhausted (after logging a loud, log-recoverable line).
 * NEVER rejects — auditing must not throw into the caller. Exported for tests.
 *
 * @param {object} args
 * @param {object} args.redis      ioredis-like client (xadd)
 * @param {object} args.event      the audit event (already includes type/timestamp/etc.)
 * @param {object} [args.logger]   logger with .error/.warn (defaults to console)
 * @param {number} [args.maxAttempts]
 * @param {number} [args.baseDelayMs]
 * @param {function} [args.sleep]  (ms) => Promise, injectable for tests
 */
async function deliverToStream({ redis, event, logger = console, maxAttempts = DEFAULT_STREAM_RETRIES, baseDelayMs = DEFAULT_STREAM_BACKOFF_MS, sleep = defaultSleep } = {}) {
    let lastErr;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await redis.xadd(STREAM_KEY, '*', 'type', event.type, 'payload', JSON.stringify(event));
            return true;
        } catch (err) {
            lastErr = err;
            if (attempt < maxAttempts) {
                await sleep(Math.min(baseDelayMs * Math.pow(2, attempt - 1), MAX_STREAM_BACKOFF_MS));
            }
        }
    }
    // Exhausted: loud + structured + log-recoverable (the full event rides on this line).
    try {
        (logger.error || logger.warn || console.error).call(logger, JSON.stringify({
            audit: true,
            auditDeliveryFailed: true,
            attempts: maxAttempts,
            error: String((lastErr && lastErr.message) || lastErr),
            ...event,
        }));
    } catch { /* never throw from audit */ }
    return false;
}

/**
 * @param {object} opts
 * @param {string} opts.service        emitting service name (e.g. 'order-service')
 * @param {object} [opts.redis]        ioredis client (optional); xadd to baalvion:events
 * @param {object} [opts.logger]       logger with .warn/.info (defaults to console)
 * @param {function} [opts.clock]      () => ISO string, for tests
 * @param {boolean} [opts.stream=true] publish to the Redis stream
 */
function createAuditEmitter({ service, redis = null, logger = console, clock, streamRetries = DEFAULT_STREAM_RETRIES, streamBackoffMs = DEFAULT_STREAM_BACKOFF_MS, sleep } = {}) {
    function emit(record) {
        // `timestamp` matches the audit field contract (userId, role, scope, action, decision, timestamp).
        const event = { service, timestamp: nowIso(clock), ...record };
        // 1. stdout (guaranteed)
        try { (logger.warn || logger.info || console.warn).call(logger, JSON.stringify({ audit: true, ...event })); } catch { /* never throw from audit */ }
        // 2. Redis stream — non-blocking, but now retried with backoff and loudly reported on
        //    final failure instead of silently swallowed. deliverToStream never rejects, so `void`
        //    is safe and the request path is never blocked or failed.
        if (redis && typeof redis.xadd === 'function') {
            void deliverToStream({ redis, event, logger, maxAttempts: streamRetries, baseDelayMs: streamBackoffMs, sleep });
        }
        return event;
    }

    const base = (type, decision) => (info = {}) => emit({
        type,
        decision,
        userId: info.userId != null ? String(info.userId) : null,
        role: info.role ?? null,
        scope: info.scope ?? null,        // { type, id } or a scope id string
        action: info.action ?? null,
        resource: info.resource ?? null,
        reason: info.reason ?? null,
        requestId: info.requestId ?? null,
        metadata: info.metadata ?? undefined,
    });

    return {
        emit,
        // A request reached a store/scope the caller has NO role in (boundary breach attempt).
        crossScopeAttempt: base('commerce.cross_scope_attempt', 'deny'),
        // The caller is in scope but lacks the required privilege level for the action.
        accessDenied: base('commerce.access_denied', 'deny'),
        // Authorization fell back to JWT-only verification during an RBAC outage.
        breakglass: base('commerce.rbac_breakglass', 'allow'),
    };
}

// No-op emitter (for tests / when auditing is intentionally disabled).
const NOOP_AUDIT = {
    emit: () => undefined,
    crossScopeAttempt: () => undefined,
    accessDenied: () => undefined,
    breakglass: () => undefined,
};

module.exports = { createAuditEmitter, NOOP_AUDIT, STREAM_KEY, deliverToStream };
