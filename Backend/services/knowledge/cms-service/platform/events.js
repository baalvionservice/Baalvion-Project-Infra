'use strict';
/**
 * cms-service domain event catalog + SDK-native emission.
 *
 * All events flow through `sdk.events` (the ONE platform event bus). The SDK
 * auto-fills the canonical envelope { eventType, tenantId, timestamp, traceId,
 * payload } from the current trace context; callers pass only the event type,
 * payload, and (where the tenant isn't already on the trace) the tenant slug.
 *
 * Tenancy: a tenant == an organisation == a CMS website. Events are keyed by the
 * website **slug** so consumers (e.g. the SDK config-resolver) can act on them —
 * `cms.integration.*` is what every service listens to in order to bust its
 * cached tenant keys the moment a key changes in the console.
 *
 * Emission is fire-and-forget and FAIL-OPEN: a missing SDK (pre-init / scripts)
 * or a publish error never propagates into business logic or request latency.
 * Event-type string constants are defined here now; they graduate to the
 * `EventType` union in @baalvion/types during Phase 5 (shared types).
 */
const { tryGetSdk } = require('./sdk');

const CmsEvents = Object.freeze({
    CONTENT_PUBLISHED: 'cms.content.published',
    CONTENT_UNPUBLISHED: 'cms.content.unpublished',
    INTEGRATION_UPDATED: 'cms.integration.updated',
    INTEGRATION_REMOVED: 'cms.integration.removed',
    MEMBER_INVITED: 'cms.member.invited',
});

/** Await an event publish; resolves quietly if the bus is unavailable. */
async function emit(eventType, payload, meta) {
    const sdk = tryGetSdk();
    if (!sdk) return; // pre-init / CLI context — no bus to publish to
    try {
        await sdk.events.publish(eventType, payload, meta);
    } catch (err) {
        try {
            sdk.logger.warn({ err: err && err.message, eventType }, 'cms event publish failed');
        } catch { /* logging must never throw into business logic */ }
    }
}

/** Fire-and-forget emit — never rejects into the caller (use post-commit). */
function emitSafe(eventType, payload, meta) {
    void emit(eventType, payload, meta);
}

module.exports = { CmsEvents, emit, emitSafe };
