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
    // Settlement on the external (RazorpayX) rail -> request a GL double-entry. Written to
    // the outbox in the SAME tx as the saga advance (publish-iff-commit); a consumer posts
    // it to the Java ledger (idempotent by transactionRef).
    SETTLEMENT_LEDGER_POST: 'oms.order.settlement.ledger_post.v1',
    // A settlement GL post PERMANENTLY failed (the ledger will always reject it): money moved
    // with no GL record. Emitted best-effort by the ledger consumer so the failure ALERTS
    // (manual review) instead of silently vanishing on the permanent-ack path.
    SETTLEMENT_LEDGER_POST_FAILED: 'oms.order.settlement.ledger_post_failed.v1',
});

async function emit(eventType, payload, meta) {
    const sdk = tryGetSdk();
    if (!sdk) return;
    try { await sdk.events.publish(eventType, payload, meta); }
    catch (err) { try { sdk.logger.warn({ err: err && err.message, eventType }, 'event publish failed'); } catch { /* never throw */ } }
}
const emitSafe = (eventType, payload, meta) => { void emit(eventType, payload, meta); };

module.exports = { OrderEvents, emit, emitSafe };
