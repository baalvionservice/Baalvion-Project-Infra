'use strict';
// Validation tests for the ledger transactional-outbox publisher (the relay → ledger adapter).
// Run: node --test tests/ledgerOutboxPublisher.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { createLedgerPublisher, buildLedgerEvent, LEDGER_TOPIC } = require('../service/ledgerOutboxPublisher');

function fakeLedger(result) {
    const calls = [];
    return {
        calls,
        async recordPaymentCapture(storeId, args) { calls.push({ fn: 'capture', storeId, args }); return result; },
        async recordRefund(storeId, args) { calls.push({ fn: 'refund', storeId, args }); return result; },
    };
}

test('publish routes a payment_capture event to recordPaymentCapture and acks on ok', async () => {
    const ledger = fakeLedger({ ok: true });
    const pub = createLedgerPublisher(ledger);
    const evt = buildLedgerEvent('payment_capture', {
        storeId: 'store-1', paymentId: 'p1', orderId: 'o1', orderNumber: 'ORD-1',
        amount: '100.00', currencyCode: 'USD', provider: 'razorpay', transactionId: 'txn1',
    });

    await pub.publish(evt); // must not throw
    assert.equal(ledger.calls.length, 1);
    assert.equal(ledger.calls[0].fn, 'capture');
    assert.equal(ledger.calls[0].storeId, 'store-1');
    assert.equal(ledger.calls[0].args.paymentId, 'p1');
    assert.equal(ledger.calls[0].args.transactionId, 'txn1');
});

test('publish routes a refund event to recordRefund', async () => {
    const ledger = fakeLedger({ ok: true });
    const pub = createLedgerPublisher(ledger);
    await pub.publish(buildLedgerEvent('refund', { storeId: 's', refundId: 'r1', orderId: 'o1', amount: '10.00' }));
    assert.equal(ledger.calls[0].fn, 'refund');
    assert.equal(ledger.calls[0].args.refundId, 'r1');
});

test('publish treats a 409-duplicate (ok:true,duplicate) as success — no throw', async () => {
    const pub = createLedgerPublisher(fakeLedger({ ok: true, duplicate: true }));
    await pub.publish(buildLedgerEvent('payment_capture', { storeId: 's', paymentId: 'p' }));
});

test('publish treats ledger-disabled (skipped) as success — no throw, nothing to deliver to', async () => {
    const pub = createLedgerPublisher(fakeLedger({ ok: false, skipped: true }));
    await pub.publish(buildLedgerEvent('payment_capture', { storeId: 's', paymentId: 'p' }));
});

test('publish THROWS on a real ledger failure so the relay retries it', async () => {
    const pub = createLedgerPublisher(fakeLedger({ ok: false, status: 500 }));
    await assert.rejects(
        () => pub.publish(buildLedgerEvent('payment_capture', { storeId: 's', paymentId: 'p' })),
        /ledger post failed/,
    );
});

test('publish THROWS on an unknown kind (dead-lettered rather than looping forever)', async () => {
    const pub = createLedgerPublisher(fakeLedger({ ok: true }));
    await assert.rejects(() => pub.publish({ payload: { kind: 'bogus', storeId: 's' } }), /unknown kind/);
});

test('buildLedgerEvent produces a PlatformEvent-shaped row with the kind in the payload', () => {
    let n = 0;
    const evt = buildLedgerEvent('payment_capture',
        { storeId: 'store-9', paymentId: 'p9', amount: '5.00' },
        { idgen: () => `id-${++n}`, clock: () => '2020-01-01T00:00:00.000Z' });

    assert.equal(evt.type, LEDGER_TOPIC);
    assert.equal(evt.payload.kind, 'payment_capture');
    assert.equal(evt.payload.storeId, 'store-9');
    assert.equal(evt.payload.paymentId, 'p9');
    assert.equal(evt.orgId, null); // storeId lives in the payload, not org_id (not assumed to be a uuid)
    assert.equal(evt.timestamp, '2020-01-01T00:00:00.000Z');
    assert.equal(evt.id, 'id-1');
    assert.equal(evt.traceId, 'id-2');
});
