'use strict';
/**
 * notification-service lifecycle event catalog + SDK-native emission.
 * Emitted through sdk.events onto the platform bus (baalvion:events) when a
 * notification is dispatched/sent/failed. tenantId + traceId auto-flow from the
 * current sdk.trace context. Fail-open: emission never breaks event processing.
 */
const { tryGetSdk } = require('./sdk');

const NotificationEvents = Object.freeze({
    DISPATCHED: 'notification.dispatched',
    SENT:       'notification.sent',
    FAILED:     'notification.failed',
});

async function emit(eventType, payload, meta) {
    const sdk = tryGetSdk();
    if (!sdk) return;
    try { await sdk.events.publish(eventType, payload, meta); }
    catch (err) { try { sdk.logger.warn({ err: err && err.message, eventType }, 'notification lifecycle emit failed'); } catch { /* never throw */ } }
}

module.exports = { NotificationEvents, emit };
