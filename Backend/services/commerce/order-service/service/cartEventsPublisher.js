'use strict';
/**
 * Pure adapter between the transactional outbox and the cart_events projection table.
 *
 * Mirrors ledgerOutboxPublisher.js's shape (a single topic, `payload.kind` distinguishes the
 * specific event), but instead of relaying to an external HTTP service, `publish()` materializes
 * the row directly into orders.cart_events — this is an in-process projection, not a
 * cross-service call, so there is no "ledger disabled/skipped" case to model.
 */
const { v4: uuidv4 } = require('uuid');
const { CartEvent } = require('../models');

const CART_TOPIC = 'commerce.cart.activity';
const CART_EVENT_KINDS = ['item_added', 'item_updated', 'item_removed', 'cart_cleared', 'cart_claimed'];

/**
 * Build a PlatformEvent-shaped outbox event for a cart activity record.
 * @param {'item_added'|'item_updated'|'item_removed'|'cart_cleared'|'cart_claimed'} kind
 * @param {{ cartId: string, storeId: string, userId?: number|null, sessionIdHash?: string|null,
 *           itemSnapshot?: object|null, cartSnapshot: object }} args
 */
function buildCartEvent(kind, args, deps = {}) {
    const idgen = deps.idgen || uuidv4;
    const clock = deps.clock || (() => new Date().toISOString());
    return {
        id: idgen(),
        type: CART_TOPIC,
        payload: { kind, ...args },
        orgId: null,
        userId: null,
        timestamp: clock(),
        traceId: idgen(),
    };
}

/** Build the EventPublisher the relay drains the cart-events outbox through. */
function createCartEventsPublisher() {
    async function publish(event) {
        const p = (event && event.payload) || {};
        const { kind, cartId, storeId, userId, sessionIdHash, itemSnapshot, cartSnapshot } = p;
        if (!CART_EVENT_KINDS.includes(kind)) {
            // Unknown kind can never succeed — throw so the relay dead-letters it instead of looping.
            throw new Error('cart events outbox: unknown kind ' + JSON.stringify(kind));
        }
        try {
            // Reuse the outbox event id as the row's own PK: a relay retry re-publishing the same
            // event hits the PK uniqueness constraint instead of double-recording the activity.
            await CartEvent.create({
                id: event.id, cartId, storeId, userId: userId ?? null, sessionIdHash: sessionIdHash ?? null,
                eventType: kind, itemSnapshot: itemSnapshot ?? null, cartSnapshot, occurredAt: event.timestamp,
            });
        } catch (err) {
            if (err && err.name === 'SequelizeUniqueConstraintError') return; // already applied — ack
            throw err;
        }
    }

    return {
        publish,
        async publishMany(events) { for (const e of events) await publish(e); },
    };
}

module.exports = { createCartEventsPublisher, buildCartEvent, CART_TOPIC, CART_EVENT_KINDS };
