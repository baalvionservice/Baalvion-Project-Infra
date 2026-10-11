'use strict';
require('./_env');
const test = require('node:test');
const assert = require('node:assert');
const s = require('../validators/intermediarySchemas');

const img = { mime: 'image/jpeg', data: 'x'.repeat(200) };
const base = { displayName: 'Test Person', services: ['buy_usdt'], qrs: [{ ...img, label: 'PhonePe' }], currency: 'USDT', network: 'TRC20' };

test('an application needs a name, a service, a QR and a way to pay the deposit', () => {
    assert.ok(s.applySchema.safeParse(base).success);
    assert.ok(!s.applySchema.safeParse({ ...base, displayName: 'A' }).success);
    assert.ok(!s.applySchema.safeParse({ ...base, services: [] }).success);
    assert.ok(!s.applySchema.safeParse({ ...base, qrs: [] }).success);
    assert.ok(!s.applySchema.safeParse({ ...base, qrs: [img, img, img, img] }).success);
    assert.ok(!s.applySchema.safeParse({ ...base, services: ['steal_money'] }).success);
    assert.ok(!s.applySchema.safeParse({ ...base, currency: 'EUR' }).success);
});

test('trade requests are bounded', () => {
    const ok = { intermediaryId: '11111111-1111-4111-8111-111111111111', serviceType: 'buy_usdt', amountUsdt: 100 };
    assert.ok(s.createTradeSchema.safeParse(ok).success);
    assert.ok(!s.createTradeSchema.safeParse({ ...ok, intermediaryId: 'nope' }).success);
    assert.ok(!s.createTradeSchema.safeParse({ ...ok, amountUsdt: -5 }).success);
    assert.ok(!s.createTradeSchema.safeParse({ ...ok, serviceType: 'x' }).success);
});

test('messages, payment proof and disputes need real content', () => {
    assert.ok(!s.messageSchema.safeParse({ body: '   ' }).success);
    assert.ok(s.messageSchema.safeParse({ body: 'hello' }).success);
    assert.ok(!s.paidSchema.safeParse({ proofs: [] }).success);
    assert.ok(s.paidSchema.safeParse({ proofs: [img] }).success);
    assert.ok(!s.disputeSchema.safeParse({ reason: 'bad' }).success);
    assert.ok(s.disputeSchema.safeParse({ reason: 'Payment sent but not received after an hour' }).success);
    assert.ok(!s.resolveSchema.safeParse({ outcome: 'refund', note: 'x' }).success);
});
