'use strict';
/**
 * Pure order lifecycle / payment-cascade rules (no I/O — unit-testable).
 * Maps a terminal payment event → (order.payment_status, order.status, saga.state).
 */
const PAYMENT_TRANSITIONS = Object.freeze({
    'payments.transaction.completed': { payment_status: 'confirmed', order_status: 'payment_confirmed', state: 'PAYMENT_CONFIRMED' },
    'payments.transaction.failed': { payment_status: 'failed', order_status: null, state: 'FAILED' },
    'payments.transaction.reversed': { payment_status: 'refunded', order_status: null, state: 'COMPENSATING' },
});

// Allowed order.status forward transitions (forward-only state machine).
const ORDER_FLOW = Object.freeze({
    draft: ['placed', 'cancelled'],
    placed: ['payment_confirmed', 'cancelled'],
    payment_confirmed: ['in_fulfillment', 'cancelled'],
    in_fulfillment: ['shipped'],
    shipped: ['delivered'],
    delivered: ['closed'],
    closed: [], cancelled: [],
});

const orderTransitionFor = (eventType) => PAYMENT_TRANSITIONS[eventType] || null;
const canTransition = (from, to) => (ORDER_FLOW[from] || []).includes(to);

module.exports = { PAYMENT_TRANSITIONS, ORDER_FLOW, orderTransitionFor, canTransition };
