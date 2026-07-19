'use strict';
/**
 * Transactional outbox for cart activity (admin live/abandoned-cart visibility).
 *
 * A cart mutation (add/update/remove/clear/claim) enqueues a cart-event in the SAME transaction
 * as the cart row update; the relay then drains it into orders.cart_events (see
 * cartEventsPublisher.js), so the activity record can never be silently dropped by a crash
 * between the cart write and a post-commit side effect — the same durability argument
 * ledgerOutbox.js already makes for money events, reused here for the SAME orders.event_outbox
 * table (schema-agnostic per-row `type` — no second outbox table needed).
 */
const { createPgOutboxStore, startOutboxRelay, relayOutbox } = require('@baalvion/events');
const config = require('../config/appConfig');
const { makeOutboxRunner } = require('../utils/outboxRunner');
const { createCartEventsPublisher, buildCartEvent } = require('./cartEventsPublisher');

const SCHEMA = config.db.schema; // 'orders'
const TABLE = 'event_outbox';

const store = createPgOutboxStore({ runner: makeOutboxRunner(), schema: SCHEMA, table: TABLE });
const publisher = createCartEventsPublisher();

const relayLog = {
    error: (o, m) => console.error(JSON.stringify({ evt: 'cart_events_outbox.error', msg: m, ...o })),
    warn:  (o, m) => console.warn(JSON.stringify({ evt: 'cart_events_outbox.warn', msg: m, ...o })),
    info:  (o, m) => console.info(JSON.stringify({ evt: 'cart_events_outbox.relay', msg: m, ...o })),
    debug: () => {},
};

/**
 * Enqueue a cart-activity event. Pass the open transaction `t` to commit it atomically with the
 * cart mutation (see cartService.js) — every call site does, so cart events are never lossy.
 */
async function enqueueCartEvent(kind, args, t = null) {
    await store.enqueue(buildCartEvent(kind, args), t ? makeOutboxRunner(t) : undefined);
}

let handle = null;

/** Start the background relay (idempotent — repeated calls return the same handle). */
function startCartEventsOutboxRelay(opts = {}) {
    if (handle) return handle;
    handle = startOutboxRelay(store, publisher, relayLog, { pollMs: 2000, ...opts });
    console.info(JSON.stringify({ evt: 'cart_events_outbox.started', pollMs: opts.pollMs || 2000 }));
    return handle;
}

async function stopCartEventsOutboxRelay() {
    if (handle) { await handle.stop(); handle = null; }
}

/** Drain one batch synchronously (used by tests / manual triggers). */
function drainOnce(opts = {}) {
    return relayOutbox(store, publisher, relayLog, opts);
}

module.exports = { enqueueCartEvent, startCartEventsOutboxRelay, stopCartEventsOutboxRelay, drainOnce };
