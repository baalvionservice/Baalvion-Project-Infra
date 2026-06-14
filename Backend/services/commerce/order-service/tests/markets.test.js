'use strict';
// order-service multi-market money math — MIRROR of commerce-service's markets.test.js.
// Guarantees this service's config/markets.js converts identically to the storefront's, so
// the persisted order price equals the displayed price. Pure unit tests — no DB, no Redis.
process.env.FX_LIVE_FEED = 'false'; // no live feed in unit tests → pure static math
process.env.FX_USD_USD = '1';
process.env.FX_USD_GBP = '0.79';
process.env.FX_USD_AED = '3.67';
process.env.FX_USD_INR = '83.3';
process.env.FX_USD_SGD = '1.35';

const { test } = require('node:test');
const assert = require('node:assert');

const markets = require('../config/markets');
const {
    convertFromBase, priceFields, isSupportedMarket, listMarkets, getMarket,
    SUPPORTED_MARKETS, BASE_CURRENCY, DEFAULT_MARKET,
} = markets;

test('registry exposes exactly the 5 supported markets with a USD base and us default', () => {
    assert.equal(BASE_CURRENCY, 'USD');
    assert.equal(DEFAULT_MARKET, 'us');
    assert.deepEqual([...SUPPORTED_MARKETS].sort(), ['ae', 'in', 'sg', 'uk', 'us']);
    assert.equal(listMarkets().length, 5);
});

test('convertFromBase applies the USD→market rate per market', () => {
    assert.equal(convertFromBase(100, 'us'), 100);
    assert.equal(convertFromBase(100, 'uk'), 79);
    assert.equal(convertFromBase(100, 'sg'), 135);
});

test('IN/AE apply psychological rounding (nearest 100 / nearest 10)', () => {
    assert.equal(convertFromBase(1, 'in'), 100);   // 83.3 → nearest 100
    assert.equal(convertFromBase(10, 'in'), 800);  // 833 → nearest 100
    assert.equal(convertFromBase(100, 'ae'), 370); // 367 → nearest 10
    assert.equal(convertFromBase(50, 'ae'), 180);  // 183.5 → nearest 10
});

test('non-rounding markets keep 2-decimal precision', () => {
    assert.equal(convertFromBase(9.99, 'uk'), 7.89);
    assert.equal(convertFromBase(9.99, 'sg'), 13.49);
});

test('unknown market / non-USD base pass through unchanged', () => {
    assert.equal(convertFromBase(100, 'ca'), 100);
    assert.equal(convertFromBase(100, ''), 100);
    assert.equal(convertFromBase(100, undefined), 100);
    assert.equal(convertFromBase(100, 'uk', 'EUR'), 100);
});

test('convertFromBase coerces unsafe base amounts to 0', () => {
    for (const bad of [NaN, Infinity, -Infinity, -5, undefined, null, 'not-a-number', {}]) {
        const out = convertFromBase(bad, 'uk');
        assert.equal(out, 0);
        assert.ok(Number.isFinite(out) && out >= 0);
    }
});

test('priceFields carries each market’s correct currency + tax rule', () => {
    const expected = {
        us: { taxType: 'SALES_TAX', taxRate: 8.5, taxInclusive: false, currencyCode: 'USD' },
        uk: { taxType: 'VAT', taxRate: 20, taxInclusive: true, currencyCode: 'GBP' },
        ae: { taxType: 'VAT', taxRate: 5, taxInclusive: true, currencyCode: 'AED' },
        in: { taxType: 'GST', taxRate: 18, taxInclusive: true, currencyCode: 'INR' },
        sg: { taxType: 'GST', taxRate: 7, taxInclusive: true, currencyCode: 'SGD' },
    };
    for (const [country, exp] of Object.entries(expected)) {
        const pf = priceFields(50, country);
        assert.equal(pf.currencyCode, exp.currencyCode, `${country} currency`);
        assert.equal(pf.taxType, exp.taxType, `${country} taxType`);
        assert.equal(pf.taxRate, exp.taxRate, `${country} taxRate`);
        assert.equal(pf.taxInclusive, exp.taxInclusive, `${country} taxInclusive`);
    }
});

test('isSupportedMarket / getMarket normalize case + whitespace', () => {
    assert.equal(isSupportedMarket('US'), true);
    assert.equal(isSupportedMarket('  uk  '), true);
    assert.equal(isSupportedMarket('ca'), false);
    assert.equal(getMarket('UK').currency, 'GBP');
    assert.equal(getMarket('ca'), null);
});
