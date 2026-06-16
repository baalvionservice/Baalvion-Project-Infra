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
const { withAdvisoryLock, ADVISORY_LOCK_KEYS } = require('./leaderLock');

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const CENT = 0.01;
const num = (v) => (v == null ? 0 : Number(v));

const POLL_MS = Number(process.env.RECONCILE_POLL_MS || 60000);
const STUCK_OUTBOX_MS = Number(process.env.RECONCILE_STUCK_OUTBOX_MS || 60000);
// Keyset page size for the order sweep — bounds memory + row-lock footprint so the
// sweep never materialises the whole order book at once.
const SCAN_BATCH = Number(process.env.RECONCILE_SCAN_BATCH || 1000);
// Hard backstop against an unbounded loop (e.g. a fetcher that never shrinks a page).
const MAX_SCAN_ITERATIONS = Number(process.env.RECONCILE_MAX_ITERATIONS || 100000);

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
 * Completeness-preserving, keyset-paginated drift scan. Pages the order book by `id`
 * so the sweep never loads the whole table at once (bounded memory + lock footprint)
 * yet still visits EVERY row — preferred over a lossy time-window, since money-truth
 * drift on an old/closed order (a bug or tampering) must still be caught. Fetchers are
 * injected so this is unit-testable without a live DB.
 *
 * @param {{ fetchOrdersPage: (lastId: any, limit: number) => Promise<Array>,
 *           fetchSagaStates: (ids: any[]) => Promise<Array>,
 *           batchSize?: number, maxIterations?: number }} deps
 * @returns {Promise<{ drifts: Array, scannedOrders: number, truncated: boolean }>}
 */
async function scanOrdersForDrift({ fetchOrdersPage, fetchSagaStates, batchSize = SCAN_BATCH, maxIterations = MAX_SCAN_ITERATIONS }) {
    const drifts = [];
    let scannedOrders = 0;
    let lastId = null;
    let i = 0;
    for (; i < maxIterations; i += 1) {
        const orders = await fetchOrdersPage(lastId, batchSize);
        if (!orders.length) break;
        const ids = orders.map((o) => o.id);
        const sagaRows = await fetchSagaStates(ids);
        const sagaByOrder = new Map(sagaRows.map((s) => [String(s.order_id), s.state]));
        for (const o of orders) {
            scannedOrders += 1;
            const found = checkOrder(o, sagaByOrder.get(String(o.id)) ?? null);
            for (const d of found) {
                drifts.push({ orderId: String(o.id), tenantId: o.tenant_id, ...d });
            }
        }
        if (orders.length < batchSize) break;
        lastId = orders[orders.length - 1].id;
    }
    return { drifts, scannedOrders, truncated: i >= maxIterations };
}

/**
 * Scan the whole order book once. `publish(type, payload, meta)` is optional; when
 * provided, each drift is emitted. Returns a structured result for callers/tests.
 */
async function reconcileOnce(publish, now = Date.now()) {
    // The whole sweep MUST run inside ONE sequelize transaction so the tenant-bypass GUC
    // is applied: models/index.js patches sequelize.transaction to emit SET LOCAL
    // app.tenant_bypass from the ALS context (set here by runWithTenant). Without the
    // transaction, SET LOCAL never fires and FORCE RLS on oms.orders / oms.order_saga_state /
    // oms.outbox_events returns ZERO rows on the pooled connection — reconciliation would
    // silently see an empty order book and never detect drift. Detection-only: no writes.
    return runWithTenant({ tenantId: null, bypass: true }, () =>
        db.sequelize.transaction(async (t) => {
        const { drifts, scannedOrders, truncated } = await scanOrdersForDrift({
            fetchOrdersPage: (lastId, limit) => db.Order.findAll({
                where: lastId == null ? {} : { id: { [db.Sequelize.Op.gt]: lastId } },
                order: [['id', 'ASC']],
                limit,
                transaction: t,
            }),
            fetchSagaStates: (ids) => db.OrderSagaState.findAll({
                where: { order_id: { [db.Sequelize.Op.in]: ids } },
                transaction: t,
            }),
        });
        if (truncated) {
            console.error(`[${config.service}] reconciliation: scan hit max iterations `
                + `(${MAX_SCAN_ITERATIONS}) — order book not fully swept this tick`);
        }

        const cutoff = new Date(now - STUCK_OUTBOX_MS);
        const stuckOutbox = await db.OutboxEvent.findAll({
            where: { status: 'PENDING', available_at: { [db.Sequelize.Op.lt]: cutoff } },
            transaction: t,
        });
        // NOTE: failedOutboxCount can briefly read low during a redrive lease — a FAILED
        // row is normalised to status=PENDING while it is being retried (see outboxRedrive
        // claim), so a row still under retry is temporarily not counted here. Operators
        // should alert on the redrive-exhausted event (oms.outbox.redrive.exhausted.v1),
        // not solely on this count.
        const failedOutbox = await db.OutboxEvent.findAll({ where: { status: 'FAILED' }, transaction: t });

        const result = {
            scannedOrders,
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
    }));
}

/**
 * Scheduling wrapper. Leader-guarded: with >1 OES replica only the instance holding
 * the RECONCILIATION advisory lock sweeps each tick; the others skip cleanly (no
 * duplicate drift alerts). The lock lives HERE, not inside reconcileOnce, so the
 * detection logic stays pure + testable.
 */
function startReconciliation(sdk) {
    const publish = sdk && sdk.events
        ? (type, payload, meta) => sdk.events.publish(type, payload, meta)
        : null;
    const tick = () => withAdvisoryLock(db.sequelize, ADVISORY_LOCK_KEYS.RECONCILIATION, () => reconcileOnce(publish))
        .catch((e) => console.error(`[${config.service}] reconcile:`, e.message));
    const timer = setInterval(tick, POLL_MS);
    timer.unref();
    return () => clearInterval(timer);
}

module.exports = { checkOrder, scanOrdersForDrift, reconcileOnce, startReconciliation, round2 };
