'use strict';
/**
 * Domain event catalog + producer. Business writes enqueue an OutboxEvent in the
 * SAME transaction (see controller); the outbox publisher is the ONLY thing that
 * calls sdk.events.publish, guaranteeing publish-iff-commit. emitSafe here is for
 * non-transactional, fire-and-forget signals only.
 */
const { tryGetSdk } = require('./sdk');

const OrderEvents = Object.freeze({
    CREATED: 'gtos.order.created.v1',
    PAYMENT_CONFIRMED: 'gtos.order.payment_confirmed.v1',
    FAILED: 'gtos.order.failed.v1',
    STATE_CHANGED: 'gtos.order.state_changed.v1',
});

async function emit(eventType, payload, meta) {
    const sdk = tryGetSdk();
    if (!sdk) return;
    try { await sdk.events.publish(eventType, payload, meta); }
    catch (err) { try { sdk.logger.warn({ err: err && err.message, eventType }, 'event publish failed'); } catch { /* never throw */ } }
}
const emitSafe = (eventType, payload, meta) => { void emit(eventType, payload, meta); };

module.exports = { OrderEvents, emit, emitSafe };
