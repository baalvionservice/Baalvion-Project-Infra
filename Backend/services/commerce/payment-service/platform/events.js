'use strict';
/**
 * payment-service domain event catalog + SDK-native emission.
 *
 * Every payment event flows through `sdk.events` (the ONE platform event bus) in
 * the canonical envelope { eventType, tenantId, timestamp, traceId, payload }.
 * Events are keyed by tenant == website slug. Emission is fail-open: a missing
 * SDK (pre-init / scripts) or a publish error never propagates into the payment
 * flow. For the ledger/webhook path we `await emit` (so the caller can guarantee
 * the event was attempted within the request) but it still never throws.
 */
const { tryGetSdk } = require('./sdk');

const PaymentEvents = Object.freeze({
    CREATED: 'payment.created',
    AUTHORIZED: 'payment.authorized',
    CAPTURED: 'payment.captured',
    FAILED: 'payment.failed',
    REFUNDED: 'payment.refunded',
    LEDGER_RECORDED: 'payment.ledger.recorded',
});

async function emit(eventType, payload, meta) {
    const sdk = tryGetSdk();
    if (!sdk) return;
    try {
        await sdk.events.publish(eventType, payload, meta);
    } catch (err) {
        try { sdk.logger.warn({ err: err && err.message, eventType }, 'payment event publish failed'); } catch { /* never throw */ }
    }
}

function emitSafe(eventType, payload, meta) {
    void emit(eventType, payload, meta);
}

module.exports = { PaymentEvents, emit, emitSafe };
