'use strict';
/**
 * Ledger transactional outbox for order-service.
 *
 * Money movements (payment captures, refunds) enqueue a ledger-mirror event into
 * `orders.event_outbox` IN THE SAME DB TRANSACTION as the order/payment mutation, so the event is
 * committed atomically with the money change — it can no longer be silently dropped on a ledger
 * outage or a process crash the way the old post-commit `safeLedger()` fire-and-forget allowed.
 *
 * A relay drains the outbox to ledger-service (which is idempotent on `transactionRef`), retrying
 * with bounded backoff and dead-lettering after the attempt cap. The hourly reconciliation sweep
 * remains the deeper backstop.
 */
const { sequelize } = require('../models');
const { createPgOutboxStore, startOutboxRelay, relayOutbox } = require('@baalvion/events');
const config = require('../config/appConfig');
const ledgerClient = require('./ledgerClient');
const { createLedgerPublisher, buildLedgerEvent } = require('./ledgerOutboxPublisher');

const SCHEMA = config.db.schema; // 'orders'
const TABLE = 'event_outbox';

/**
 * Adapt a Sequelize connection (or an open transaction) to the @baalvion/events PgQueryRunner
 * shape `{ query(sql, params) => { rows } }`. With no `type`, sequelize.query returns
 * `[rows, meta]`; for SELECT and `UPDATE ... RETURNING` `rows` is the row array, otherwise []/undefined.
 */
function makeRunner(t) {
    return {
        query: async (text, params) => {
            const [rows] = await sequelize.query(text, { bind: params, ...(t ? { transaction: t } : {}) });
            return { rows: Array.isArray(rows) ? rows : [] };
        },
    };
}

const store = createPgOutboxStore({ runner: makeRunner(), schema: SCHEMA, table: TABLE });
const publisher = createLedgerPublisher(ledgerClient);

const relayLog = {
    error: (o, m) => console.error(JSON.stringify({ evt: 'ledger_outbox.error', msg: m, ...o })),
    warn:  (o, m) => console.warn(JSON.stringify({ evt: 'ledger_outbox.warn', msg: m, ...o })),
    info:  (o, m) => console.info(JSON.stringify({ evt: 'ledger_outbox.relay', msg: m, ...o })),
    debug: () => {},
};

/**
 * Enqueue a captured-payment ledger mirror. Pass the open transaction `t` to commit it atomically
 * with the capture; omit `t` for paths that aren't transaction-wrapped (durable + retried either way).
 */
async function enqueuePaymentCapture(args, t = null) {
    await store.enqueue(buildLedgerEvent('payment_capture', args), t ? makeRunner(t) : undefined);
}

/** Enqueue a refund ledger mirror (see enqueuePaymentCapture for the `t` semantics). */
async function enqueueRefund(args, t = null) {
    await store.enqueue(buildLedgerEvent('refund', args), t ? makeRunner(t) : undefined);
}

let handle = null;

/** Start the background relay (idempotent — repeated calls return the same handle). */
function startLedgerOutboxRelay(opts = {}) {
    if (handle) return handle;
    handle = startOutboxRelay(store, publisher, relayLog, { pollMs: 2000, ...opts });
    console.info(JSON.stringify({ evt: 'ledger_outbox.started', pollMs: opts.pollMs || 2000 }));
    return handle;
}

async function stopLedgerOutboxRelay() {
    if (handle) { await handle.stop(); handle = null; }
}

/** Drain one batch synchronously (used by tests / manual triggers). */
function drainOnce(opts = {}) {
    return relayOutbox(store, publisher, relayLog, opts);
}

module.exports = {
    store,
    publisher,
    makeRunner,
    enqueuePaymentCapture,
    enqueueRefund,
    startLedgerOutboxRelay,
    stopLedgerOutboxRelay,
    drainOnce,
};
