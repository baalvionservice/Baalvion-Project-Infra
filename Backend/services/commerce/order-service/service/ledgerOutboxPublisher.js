'use strict';
/**
 * Pure adapter between the transactional outbox and the (idempotent) ledger HTTP client.
 *
 * Kept free of config/model/DB imports so it is unit-testable in isolation. The relay calls
 * `publish(event)` for each claimed outbox row; this turns the row back into the right ledger call.
 *
 * Delivery contract (so the relay can retry correctly):
 *   - ledger post ok (incl. 409 duplicate)  → resolve  (ack, mark SENT)
 *   - ledger DISABLED / skipped              → resolve  (nothing to deliver to; not a failure)
 *   - any real failure                       → THROW    (relay backs off + retries, dead-letters
 *                                                        after maxAttempts — never silently dropped)
 */
const { v4: uuidv4 } = require('uuid');

const LEDGER_TOPIC = 'commerce.ledger.entry';

/**
 * Build a PlatformEvent-shaped outbox event for a ledger mirror.
 * @param {'payment_capture'|'refund'} kind
 * @param {object} args  must include storeId + the ledger call fields
 * @param {object} [deps] { idgen, clock } injectable for deterministic tests
 */
function buildLedgerEvent(kind, args, deps = {}) {
    const idgen = deps.idgen || uuidv4;
    const clock = deps.clock || (() => new Date().toISOString());
    const { storeId } = args;
    return {
        id: idgen(),
        type: LEDGER_TOPIC,
        payload: { kind, ...args },
        // org_id is left null: storeId is not guaranteed to be a uuid in every environment, and the
        // relay reads cross-store anyway. The tenant lives in payload.storeId (used as the ledger tenant).
        orgId: null,
        userId: null,
        timestamp: clock(),
        traceId: idgen(),
    };
}

/** Build the EventPublisher the relay drains the ledger outbox through. */
function createLedgerPublisher(ledgerClient) {
    async function publish(event) {
        const p = (event && event.payload) || {};
        const { kind, storeId } = p;
        const args = {
            paymentId: p.paymentId,
            refundId: p.refundId,
            orderId: p.orderId,
            orderNumber: p.orderNumber,
            amount: p.amount,
            currencyCode: p.currencyCode,
            provider: p.provider,
            transactionId: p.transactionId,
            reason: p.reason,
        };

        let res;
        if (kind === 'payment_capture') {
            res = await ledgerClient.recordPaymentCapture(storeId, args);
        } else if (kind === 'refund') {
            res = await ledgerClient.recordRefund(storeId, args);
        } else {
            // Unknown kind can never succeed — throw so the relay dead-letters it instead of looping.
            throw new Error('ledger outbox: unknown kind ' + JSON.stringify(kind));
        }

        // ok (incl. duplicate) or skipped (ledger disabled) → ack. Otherwise fail → relay retries.
        if (res && (res.ok || res.skipped)) return;
        throw new Error('ledger post failed: ' + JSON.stringify(res));
    }

    return {
        publish,
        async publishMany(events) { for (const e of events) await publish(e); },
    };
}

module.exports = { createLedgerPublisher, buildLedgerEvent, LEDGER_TOPIC };
