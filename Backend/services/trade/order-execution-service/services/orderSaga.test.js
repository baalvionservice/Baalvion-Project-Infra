'use strict';
const { orderTransitionFor, canTransition, ORDER_FLOW, PAYMENT_TRANSITIONS } = require('./orderSaga');

describe('orderSaga — payment cascade', () => {
    test('completed payment confirms the order', () => {
        expect(orderTransitionFor('payments.transaction.completed')).toEqual({
            payment_status: 'confirmed', order_status: 'payment_confirmed', state: 'PAYMENT_CONFIRMED',
        });
    });

    test('failed payment marks payment failed without forcing an order status', () => {
        const t = orderTransitionFor('payments.transaction.failed');
        expect(t.payment_status).toBe('failed');
        expect(t.order_status).toBeNull();
        expect(t.state).toBe('FAILED');
    });

    test('reversed payment enters compensation', () => {
        expect(orderTransitionFor('payments.transaction.reversed').state).toBe('COMPENSATING');
    });

    test('unknown event yields no transition (ignored, idempotent)', () => {
        expect(orderTransitionFor('payments.transaction.bogus')).toBeNull();
        expect(orderTransitionFor(undefined)).toBeNull();
    });
});

describe('orderSaga — forward-only state machine', () => {
    test('allows valid forward transitions', () => {
        expect(canTransition('placed', 'payment_confirmed')).toBe(true);
        expect(canTransition('payment_confirmed', 'in_fulfillment')).toBe(true);
        expect(canTransition('shipped', 'delivered')).toBe(true);
    });

    test('rejects backward / illegal transitions', () => {
        expect(canTransition('delivered', 'placed')).toBe(false);
        expect(canTransition('payment_confirmed', 'delivered')).toBe(false); // must pass through fulfillment
        expect(canTransition('closed', 'shipped')).toBe(false);
    });

    test('terminal states have no exits', () => {
        expect(ORDER_FLOW.closed).toEqual([]);
        expect(ORDER_FLOW.cancelled).toEqual([]);
    });

    test('every transition target is itself a known state (no dangling edges)', () => {
        const states = new Set(Object.keys(ORDER_FLOW));
        for (const [, targets] of Object.entries(ORDER_FLOW)) {
            for (const to of targets) expect(states.has(to)).toBe(true);
        }
    });

    test('cancellation is reachable from every pre-terminal state', () => {
        for (const s of ['draft', 'placed', 'payment_confirmed']) {
            expect(ORDER_FLOW[s]).toContain('cancelled');
        }
    });

    test('payment transition map only references known order states', () => {
        const states = new Set(Object.keys(ORDER_FLOW));
        for (const [, t] of Object.entries(PAYMENT_TRANSITIONS)) {
            if (t.order_status !== null) expect(states.has(t.order_status)).toBe(true);
        }
    });
});
