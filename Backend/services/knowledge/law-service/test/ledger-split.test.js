'use strict';
const { test } = require('node:test');
const assert = require('node:assert');

// Pure money math — no DB / no env coupling.
const { splitFee, formatMoney, currencyForCountry, round2 } = require('../utils/money');

test('splitFee withholds the platform fee and nets the remainder', () => {
    const { fee, net } = splitFee(100, 15);
    assert.strictEqual(fee, 15);
    assert.strictEqual(net, 85);
    assert.strictEqual(round2(fee + net), 100);
});

test('splitFee rounds to 2 decimals and conserves the total', () => {
    const { fee, net } = splitFee(99.99, 15);
    assert.strictEqual(round2(fee + net), 99.99);
});

test('splitFee clamps fee percent to [0,100]', () => {
    assert.strictEqual(splitFee(100, -5).fee, 0);
    assert.strictEqual(splitFee(100, 250).fee, 100);
});

test('splitFee of zero is zero', () => {
    assert.deepStrictEqual(splitFee(0, 15), { fee: 0, net: 0 });
});

test('formatMoney uses the currency symbol + decimals', () => {
    assert.strictEqual(formatMoney(1000, 'USD'), '$1,000.00');
    assert.strictEqual(formatMoney(1000, 'INR'), '₹1,000.00');
    assert.strictEqual(formatMoney(1000, 'JPY'), '¥1,000');
});

test('currencyForCountry maps known countries, defaults to USD', () => {
    assert.strictEqual(currencyForCountry('IN'), 'INR');
    assert.strictEqual(currencyForCountry('gb'), 'GBP');
    assert.strictEqual(currencyForCountry('ZZ'), 'USD');
});
