'use strict';
// Structured audit emission for the commerce RBAC PEP. Two sinks, both non-blocking and
// fail-open (auditing must NEVER break or slow a request):
//   1. stdout as a single-line JSON record — the guaranteed, log-aggregation-friendly sink.
//   2. best-effort publish to the `baalvion:events` Redis stream, consumed by audit-service.
//
// Event types: commerce.access_denied, commerce.cross_scope_attempt, commerce.rbac_breakglass.
// (Role changes are audited at the source of truth — rbac-service — not here.)

const STREAM_KEY = 'baalvion:events';

function nowIso(clock) {
    // `clock` is injectable so tests are deterministic (no Date.now in the hot path otherwise).
    return clock ? clock() : new Date().toISOString();
}

/**
 * @param {object} opts
 * @param {string} opts.service        emitting service name (e.g. 'order-service')
 * @param {object} [opts.redis]        ioredis client (optional); xadd to baalvion:events
 * @param {object} [opts.logger]       logger with .warn/.info (defaults to console)
 * @param {function} [opts.clock]      () => ISO string, for tests
 * @param {boolean} [opts.stream=true] publish to the Redis stream
 */
function createAuditEmitter({ service, redis = null, logger = console, clock } = {}) {
    function emit(record) {
        // `timestamp` matches the audit field contract (userId, role, scope, action, decision, timestamp).
        const event = { service, timestamp: nowIso(clock), ...record };
        // 1. stdout (guaranteed)
        try { (logger.warn || logger.info || console.warn).call(logger, JSON.stringify({ audit: true, ...event })); } catch { /* never throw from audit */ }
        // 2. Redis stream (best-effort, non-blocking)
        if (redis && typeof redis.xadd === 'function') {
            Promise.resolve()
                .then(() => redis.xadd(STREAM_KEY, '*', 'type', event.type, 'payload', JSON.stringify(event)))
                .catch(() => { /* swallow — audit-service may be down; never fail the request */ });
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

module.exports = { createAuditEmitter, NOOP_AUDIT, STREAM_KEY };
