'use strict';
const { orderRefFromPayload } = require('./financeRef');

describe('orderRefFromPayload', () => {
    test('direct orderId', () => {
        expect(orderRefFromPayload({ orderId: 'abc' })).toBe('abc');
    });
    test('order_id snake_case', () => {
        expect(orderRefFromPayload({ order_id: 'xyz' })).toBe('xyz');
    });
    test('reference', () => {
        expect(orderRefFromPayload({ reference: 'r1' })).toBe('r1');
    });
    test('recovers order id from idempotencyKey order-<id>', () => {
        expect(orderRefFromPayload({ idempotencyKey: 'order-9f1c2b3d' })).toBe('9f1c2b3d');
    });
    test('idempotency_key snake_case', () => {
        expect(orderRefFromPayload({ idempotency_key: 'order-77' })).toBe('77');
    });
    test('direct ref wins over idempotencyKey', () => {
        expect(orderRefFromPayload({ orderId: 'A', idempotencyKey: 'order-B' })).toBe('A');
    });
    test('non-order idempotencyKey -> null', () => {
        expect(orderRefFromPayload({ idempotencyKey: 'pay-123' })).toBeNull();
    });
    test('empty/invalid -> null', () => {
        expect(orderRefFromPayload(null)).toBeNull();
        expect(orderRefFromPayload({})).toBeNull();
    });
});
