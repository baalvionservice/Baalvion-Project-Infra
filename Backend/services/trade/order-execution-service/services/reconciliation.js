'use strict';
/**
 * Order money-truth & saga reconciliation (R3).
 *
 * Detection-only drift sweep over oms.orders / oms.order_saga_state /
 * oms.outbox_events. It NEVER mutates money — server-computed figures that no
 * longer reconcile indicate a bug or tampering, which a human/owning process must
 * resolve, not a silent auto-correct. Each finding is logged and emitted as
 * `oms.order.reconciliation.drift.v1` so it lands on the bus + audit chain.
 *
 * Checks per order:
 *   MONEY_TRUTH_DRIFT — total_value != round2(subtotal + duty + tax)
 *   FX_DRIFT          — base_currency_amount != round2(total_value * fx_rate_used)
 *   SAGA_DRIFT        — payment confirmed on the order but saga state disagrees
 *   STATE_DRIFT       — payment confirmed but order.status never advanced
 * Plus delivery health: outbox rows stuck PENDING past an age threshold, or FAILED.
 */
const db = require('../models');
const { runWithTenant } = require('@baalvion/tenancy');
const config = require('../config/appConfig');

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const CENT = 0.01;
const num = (v) => (v == null ? 0 : Number(v));

const POLL_MS = Number(process.env.RECONCILE_POLL_MS || 60000);
const STUCK_OUTBOX_MS = Number(process.env.RECONCILE_STUCK_OUTBOX_MS || 60000);

// States that legitimately follow a confirmed payment.
const POST_PAYMENT_STATES = new Set(['payment_confirmed', 'in_fulfillment', 'shipped', 'delivered', 'closed']);

/**
 * Pure per-order drift checks. `order` is a plain row; `sagaState` is the saga
 * state string (or null). Returns an array of { code, detail } (empty = clean).
 */
function checkOrder(order, sagaState) {
    const drifts = [];
    const subtotal = num(order.subtotal);
    const duty = num(order.duty_amount);
    const tax = num(order.tax_amount);
    const total = num(order.total_value);
    const expectedTotal = round2(subtotal + duty + tax);
    if (Math.abs(total - expectedTotal) > CENT) {
        drifts.push({ code: 'MONEY_TRUTH_DRIFT', detail: `total_value=${total} != subtotal+duty+tax=${expectedTotal}` });
    }

    const fx = num(order.fx_rate_used) || 1;
    const base = num(order.base_currency_amount);
    const expectedBase = round2(total * fx);
    if (Math.abs(base - expectedBase) > CENT) {
        drifts.push({ code: 'FX_DRIFT', detail: `base_currency_amount=${base} != total_value*fx(${fx})=${expectedBase}` });
    }

    if (order.payment_status === 'confirmed') {
        if (sagaState !== 'PAYMENT_CONFIRMED') {
            drifts.push({ code: 'SAGA_DRIFT', detail: `payment_status=confirmed but saga state=${sagaState ?? '<none>'}` });
        }
        if (!POST_PAYMENT_STATES.has(order.status)) {
            drifts.push({ code: 'STATE_DRIFT', detail: `payment_status=confirmed but order.status=${order.status}` });
        }
    }
    return drifts;
}

/**
 * Scan the whole order book once. `publish(type, payload, meta)` is optional; when
 * provided, each drift is emitted. Returns a structured result for callers/tests.
 */
async function reconcileOnce(publish, now = Date.now()) {
    return runWithTenant({ tenantId: null, bypass: true }, async () => {
        const orders = await db.Order.findAll();
        const sagaRows = await db.OrderSagaState.findAll();
        const sagaByOrder = new Map(sagaRows.map((s) => [String(s.order_id), s.state]));

        const drifts = [];
        for (const o of orders) {
            const found = checkOrder(o, sagaByOrder.get(String(o.id)) ?? null);
            for (const d of found) {
                drifts.push({ orderId: String(o.id), tenantId: o.tenant_id, ...d });
            }
        }

        const cutoff = new Date(now - STUCK_OUTBOX_MS);
        const stuckOutbox = await db.OutboxEvent.findAll({
            where: { status: 'PENDING', available_at: { [db.Sequelize.Op.lt]: cutoff } },
        });
        const failedOutbox = await db.OutboxEvent.findAll({ where: { status: 'FAILED' } });

        const result = {
            scannedOrders: orders.length,
            driftCount: drifts.length,
            drifts,
            stuckOutboxCount: stuckOutbox.length,
            failedOutboxCount: failedOutbox.length,
        };

        if (typeof publish === 'function') {
            for (const d of drifts) {
                try {
                    await publish('oms.order.reconciliation.drift.v1',
                        { orderId: d.orderId, code: d.code, detail: d.detail },
                        { tenantId: d.tenantId });
                } catch (e) { console.error(`[${config.service}] reconcile emit:`, e.message); }
            }
        }
        if (drifts.length || stuckOutbox.length || failedOutbox.length) {
            console.error(`[${config.service}] reconciliation: ${drifts.length} money/saga drift(s), `
                + `${stuckOutbox.length} stuck + ${failedOutbox.length} failed outbox row(s)`);
        }
        return result;
    });
}

function startReconciliation(sdk) {
    const publish = sdk && sdk.events
        ? (type, payload, meta) => sdk.events.publish(type, payload, meta)
        : null;
    const timer = setInterval(
        () => reconcileOnce(publish).catch((e) => console.error(`[${config.service}] reconcile:`, e.message)),
        POLL_MS);
    timer.unref();
    return () => clearInterval(timer);
}

module.exports = { checkOrder, reconcileOnce, startReconciliation, round2 };
