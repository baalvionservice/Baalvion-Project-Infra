'use strict';
/**
 * Redis Streams consumer (sdk.events.subscribe). Reacts to finance events that
 * arrive over the bus (in addition to the HMAC webhook bridge) and to upstream
 * domain events. Idempotent via the SDK event id; throwing leaves the entry pending
 * for XAUTOCLAIM redelivery (at-least-once).
 */
const config = require('../config/appConfig');
const { initSdk, getSdk } = require('../platform/sdk');
const { orderTransitionFor } = require('../services/orderSaga');
const { OrderEvents } = require('../platform/events');
const ledgerClient = require('../services/ledgerClient');
const db = require('../models');
const { runWithTenant } = require('@baalvion/tenancy');

let _subscription = null;
let _ledgerSubscription = null;

// Strip CR/LF/tab from dynamic values before logging (no log-injection / forging).
const sanitize = (v) => String(v == null ? '' : v).replace(/[\r\n\t]/g, ' ');

async function dispatch(eventType, payload) {
    const tr = orderTransitionFor(eventType);
    if (!tr) return; // not an event we cascade off the bus
    const orderId = payload.orderId || payload.order_id;
    if (!orderId) return;
    await runWithTenant({ tenantId: null, bypass: true }, () =>
        db.sequelize.transaction(async (t) => {
            const order = await db.Order.findByPk(String(orderId), { transaction: t });
            if (!order) return;
            order.payment_status = tr.payment_status;
            if (tr.order_status) order.status = tr.order_status;
            await order.save({ transaction: t });
            await db.OrderSagaState.upsert({ order_id: String(order.id), tenant_id: order.tenant_id, state: tr.state, last_event: eventType, updated_at: new Date() }, { transaction: t });
        }));
}

async function handle(event) {
    await getSdk().trace.runWith({ traceId: event.traceId, tenantId: event.tenantId }, () =>
        dispatch(event.eventType, event.payload || {}));
}

// GL double-entry for an external-rail settlement. Posts to the Java ledger (idempotent by
// transactionRef, so at-least-once redelivery is safe). A 4xx is permanent (bad request) ->
// ack + log to avoid a poison-message loop; a 5xx/network/timeout is transient -> rethrow so
// XAUTOCLAIM redelivers.
async function dispatchLedgerPost(payload) {
    try {
        await ledgerClient.postEntry({
            tenantId: payload.tenantId,
            transactionRef: payload.transactionRef,
            debitAccountId: payload.debitAccountId,
            creditAccountId: payload.creditAccountId,
            amount: payload.amount,
            currency: payload.currency,
            entryType: config.ledger.entryType,
            description: `OES settlement order ${payload.orderId}`,
        });
    } catch (err) {
        const status = err && typeof err.status === 'number' ? err.status : null;
        // 429 (rate-limit) and 408 (proxy timeout) are 4xx but TRANSIENT — they must redeliver,
        // not be misclassified as a permanently-rejected request.
        const permanent = (status && status >= 400 && status < 500 && status !== 429 && status !== 408)
            || err.code === 'LEDGER_BAD_ACCOUNTS' || err.code === 'LEDGER_BAD_AMOUNT';
        if (permanent) {
            // Money moved with NO GL record. Ack to avoid a poison-message loop, but ALERT first:
            // a structured event so this never silently vanishes. The publish is best-effort and
            // must never throw (an alert failure must not block the ack / re-queue the message).
            console.error(`[${config.service}] ledger post permanently failed for order ${sanitize(payload.orderId)}: ${sanitize(err.message)} (acked, manual review)`);
            try {
                await getSdk().events.publish(
                    OrderEvents.SETTLEMENT_LEDGER_POST_FAILED,
                    { orderId: payload.orderId, transactionRef: payload.transactionRef, reason: err.message, status },
                    { tenantId: payload.tenantId },
                );
            } catch (alertErr) {
                console.error(`[${config.service}] ledger_post_failed alert publish failed for order ${sanitize(payload.orderId)}: ${sanitize(alertErr && alertErr.message)}`);
            }
            return; // ack — do not redeliver a request the ledger will always reject
        }
        // Transient — log for operational visibility, then rethrow so XAUTOCLAIM redelivers.
        console.error(`[${config.service}] ledger post transient failure for order ${sanitize(payload.orderId)}: ${sanitize(err.message)} (will redeliver)`);
        throw err;
    }
}

async function handleLedgerPost(event) {
    await getSdk().trace.runWith({ traceId: event.traceId, tenantId: event.tenantId }, () =>
        dispatchLedgerPost(event.payload || {}));
}

async function startEventConsumer() {
    const sdk = await initSdk();
    _subscription = await sdk.events.subscribe('payments.>', config.eventBus.consumerGroup, handle);
    _ledgerSubscription = await sdk.events.subscribe(
        OrderEvents.SETTLEMENT_LEDGER_POST, `${config.eventBus.consumerGroup}-ledger`, handleLedgerPost);
    sdk.logger.info({ group: config.eventBus.consumerGroup }, 'event consumer started');
    return _subscription;
}
async function stopEventConsumer() {
    if (_subscription) { await _subscription.unsubscribe(); _subscription = null; }
    if (_ledgerSubscription) { await _ledgerSubscription.unsubscribe(); _ledgerSubscription = null; }
}

module.exports = { startEventConsumer, stopEventConsumer, dispatch, handle, dispatchLedgerPost, handleLedgerPost };
