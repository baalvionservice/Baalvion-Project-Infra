'use strict';
// Never-paid return dead-end (P2). createReturn allows returns on shipped/delivered orders that may
// never have been captured; refundPayment would 409 forever, stranding the RMA at 'received'.
// updateReturnStatus('refunded') on an unpaid order must resolve to a TERMINAL closed/amount-0 state
// (no provider call), not a 409/500. A paid order still refunds normally.
process.env.JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'dummy';

const { test } = require('node:test');
const assert = require('node:assert');

const cache = require('../service/cacheService');
cache.get = async () => null; cache.set = async () => {}; cache.del = async () => {}; cache.delPattern = async () => {};
cache.keys = cache.keys || {}; cache.keys.order = cache.keys.order || ((id) => `order:${id}`);

const models = require('../models');
const orderService = require('../service/orderService');
const returnService = require('../service/returnService');

const STORE = 'store-1';

function fakeReturn(updateSpy) {
    return {
        id: 'ret1', orderId: 'ord1', storeId: STORE, status: 'received', returnNumber: 'RET-X',
        items: [{ refundAmount: 50 }],
        update: async (patch) => { Object.assign(updateSpy, patch); },
        toJSON() { return { id: 'ret1', ...updateSpy }; },
    };
}

test('refunded transition on a NEVER-PAID order closes the RMA at amount 0 (no provider 409)', async () => {
    const spy = {};
    models.OrdersReturn.findOne = async () => fakeReturn(spy);
    // The order was shipped/delivered but never captured (paymentStatus stays 'pending').
    models.OrdersOrder.findOne = async () => ({ totalAmount: 50, paymentStatus: 'pending' });
    models.OrdersOrder.update = async () => [1];
    // refundPayment MUST NOT be called for an unpaid order.
    let refundCalled = false;
    const origRefund = orderService.refundPayment;
    orderService.refundPayment = async () => { refundCalled = true; throw new Error('refund should not run on an unpaid order'); };

    try {
        const out = await returnService.updateReturnStatus(STORE, 'ret1', 'refunded', 7);
        assert.equal(spy.status, 'closed', 'unpaid RMA resolves to terminal closed');
        assert.equal(Number(spy.totalRefund), 0, 'no money refunded');
        assert.equal(spy.refundMethod, 'none');
        assert.equal(refundCalled, false, 'provider refund was never invoked');
        assert.ok(out && out.id === 'ret1');
        // The forced terminal 'closed' (not the requested 'refunded') is surfaced to the caller and
        // persisted on the return metadata so it is not a silent surprise.
        assert.equal(out.reason, 'order_never_paid', 'caller is told WHY the RMA closed without a refund');
        assert.equal(spy.metadata && spy.metadata.closedReason, 'order_never_paid', 'reason is stamped on the return metadata');
    } finally {
        orderService.refundPayment = origRefund;
    }
});

test('refunded transition on a PAID order still delegates to refundPayment', async () => {
    const spy = {};
    models.OrdersReturn.findOne = async () => fakeReturn(spy);
    models.OrdersOrder.findOne = async () => ({ totalAmount: 50, paymentStatus: 'paid' });
    models.OrdersOrder.update = async () => [1];
    let refundCalled = false;
    const origRefund = orderService.refundPayment;
    orderService.refundPayment = async () => { refundCalled = true; return { provider: 'mock' }; };
    try {
        await returnService.updateReturnStatus(STORE, 'ret1', 'refunded', 7);
        assert.equal(refundCalled, true, 'paid order routes through the real refund path');
        assert.equal(spy.status, 'refunded');
        assert.equal(Number(spy.totalRefund), 50);
    } finally {
        orderService.refundPayment = origRefund;
    }
});
