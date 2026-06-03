'use strict';
// Multi-market money math — the 5-market commerce contract (US/UK/AE/IN/SG).
// Pins FX conversion (incl. per-market psychological rounding), the price+tax envelope
// shape, the safeAmount guards (NaN/Infinity/negative/undefined → 0), market lookup, and
// the registry size. Pure unit tests against config/markets.js — no DB, no Redis, no disk.
//
// FX rates are read from FX_USD_<CCY> envs (or the static defaults baked into markets.js).
// To keep the conversion assertions deterministic regardless of the developer's .env, we
// pin the rates to the canonical defaults BEFORE requiring the module.
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

// ════════════════════ REGISTRY SHAPE ════════════════════
test('the registry exposes exactly the 5 supported markets with a USD base and us default', () => {
    assert.equal(BASE_CURRENCY, 'USD');
    assert.equal(DEFAULT_MARKET, 'us');
    assert.deepEqual([...SUPPORTED_MARKETS].sort(), ['ae', 'in', 'sg', 'uk', 'us']);

    const list = listMarkets();
    assert.equal(list.length, 5, 'listMarkets returns all 5 markets');
    assert.deepEqual(list.map((m) => m.country).sort(), ['ae', 'in', 'sg', 'uk', 'us']);
    // listMarkets must hand back COPIES, not the internal records (no external mutation).
    list[0].fxRate = 999999;
    assert.notEqual(getMarket(list[0].country).fxRate, 999999, 'internal market record is not mutated by callers');
});

test('every market record carries currency, locale and a complete tax rule', () => {
    for (const m of listMarkets()) {
        assert.equal(typeof m.currency, 'string');
        assert.ok(m.currency.length === 3, `${m.country} currency is ISO-4217`);
        assert.equal(typeof m.locale, 'string');
        assert.ok(['SALES_TAX', 'VAT', 'GST'].includes(m.taxType), `${m.country} has a known taxType`);
        assert.equal(typeof m.taxRate, 'number');
        assert.equal(typeof m.taxInclusive, 'boolean');
        assert.ok(Number.isFinite(m.fxRate) && m.fxRate > 0, `${m.country} fxRate is positive finite`);
    }
});

// ════════════════════ CONVERT FROM BASE (per-market FX + rounding) ════════════════════
test('convertFromBase applies the USD→market rate per market', () => {
    assert.equal(convertFromBase(100, 'us'), 100);   // 100 * 1
    assert.equal(convertFromBase(100, 'uk'), 79);    // 100 * 0.79
    assert.equal(convertFromBase(100, 'sg'), 135);   // 100 * 1.35
});

test('AE rounds converted prices to the nearest 10 (AED psychological pricing)', () => {
    // 100 * 3.67 = 367 → nearest 10 → 370
    assert.equal(convertFromBase(100, 'ae'), 370);
    // 50 * 3.67 = 183.5 → nearest 10 → 180
    assert.equal(convertFromBase(50, 'ae'), 180);
    // 1 * 3.67 = 3.67 → nearest 10 → 0
    assert.equal(convertFromBase(1, 'ae'), 0);
});

test('IN rounds converted prices to the nearest 100 (INR psychological pricing)', () => {
    // 1 * 83.3 = 83.3 → nearest 100 → 100
    assert.equal(convertFromBase(1, 'in'), 100);
    // 10 * 83.3 = 833 → nearest 100 → 800
    assert.equal(convertFromBase(10, 'in'), 800);
    // 2 * 83.3 = 166.6 → nearest 100 → 200
    assert.equal(convertFromBase(2, 'in'), 200);
});

test('non-rounding markets keep 2-decimal precision', () => {
    // 9.99 * 0.79 = 7.8921 → 2dp → 7.89
    assert.equal(convertFromBase(9.99, 'uk'), 7.89);
    // 9.99 * 1.35 = 13.4865 → 2dp → 13.49
    assert.equal(convertFromBase(9.99, 'sg'), 13.49);
});

test('convertFromBase returns the raw amount for an unknown market (no conversion)', () => {
    assert.equal(convertFromBase(100, 'ca'), 100);
    assert.equal(convertFromBase(100, ''), 100);
    assert.equal(convertFromBase(100, undefined), 100);
});

test('convertFromBase passes through unchanged when the base currency is not USD', () => {
    // Only a USD base is supported today; a non-USD base must not be silently re-rated.
    assert.equal(convertFromBase(100, 'uk', 'EUR'), 100);
});

// ════════════════════ safeAmount GUARDS (money math never emits NaN/Infinity/negative) ════
test('convertFromBase coerces unsafe base amounts to 0 before converting', () => {
    for (const bad of [NaN, Infinity, -Infinity, -5, undefined, null, 'not-a-number', {}]) {
        const out = convertFromBase(bad, 'uk');
        assert.equal(out, 0, `convertFromBase(${String(bad)}, 'uk') guards to 0`);
        assert.ok(Number.isFinite(out) && out >= 0, 'output is finite and non-negative');
    }
});

test('a valid numeric string base is accepted and converted', () => {
    // Number('100') === 100 — safeAmount accepts coercible finite values.
    assert.equal(convertFromBase('100', 'uk'), 79);
});

test('zero converts to zero in every market', () => {
    for (const c of SUPPORTED_MARKETS) {
        assert.equal(convertFromBase(0, c), 0, `${c}: 0 → 0`);
    }
});

// ════════════════════ priceFields (price + tax envelope) ════════════════════
test('priceFields returns the full converted price + tax envelope for a known market', () => {
    const uk = priceFields(100, 'uk');
    assert.deepEqual(uk, {
        price: 79,
        currencyCode: 'GBP',
        taxType: 'VAT',
        taxRate: 20,
        taxInclusive: true,
    });

    const us = priceFields(100, 'us');
    assert.deepEqual(us, {
        price: 100,
        currencyCode: 'USD',
        taxType: 'SALES_TAX',
        taxRate: 8.5,
        taxInclusive: false,
    });
});

test('priceFields carries each market’s correct tax rule', () => {
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
        assert.ok(Number.isFinite(pf.price) && pf.price >= 0, `${country} price is safe`);
    }
});

test('priceFields falls back to base currency only (no tax fields) for an unknown market', () => {
    const pf = priceFields(100, 'ca');
    assert.deepEqual(pf, { price: 100, currencyCode: 'USD' });
    assert.equal(pf.taxType, undefined);
    assert.equal(pf.taxRate, undefined);
    assert.equal(pf.taxInclusive, undefined);
});

test('priceFields guards an unsafe base amount to a 0 price while keeping the tax envelope', () => {
    const pf = priceFields(NaN, 'in');
    assert.equal(pf.price, 0);
    assert.equal(pf.currencyCode, 'INR');
    assert.equal(pf.taxType, 'GST');
    assert.equal(pf.taxRate, 18);
    assert.equal(pf.taxInclusive, true);
});

// ════════════════════ isSupportedMarket / getMarket ════════════════════
test('isSupportedMarket is true for the 5 markets (case/whitespace-insensitive) and false otherwise', () => {
    for (const c of ['us', 'uk', 'ae', 'in', 'sg']) {
        assert.equal(isSupportedMarket(c), true, `${c} is supported`);
    }
    assert.equal(isSupportedMarket('US'), true, 'uppercase is normalized');
    assert.equal(isSupportedMarket('  uk  '), true, 'whitespace is trimmed');

    for (const c of ['ca', 'fr', 'jp', '', null, undefined, 123, {}]) {
        assert.equal(isSupportedMarket(c), false, `${String(c)} is not supported`);
    }
});

test('getMarket returns the record for a known market and null otherwise', () => {
    assert.equal(getMarket('uk').currency, 'GBP');
    assert.equal(getMarket('UK').currency, 'GBP', 'normalized lookup');
    assert.equal(getMarket('ca'), null);
    assert.equal(getMarket(''), null);
    assert.equal(getMarket(undefined), null);
});

// ════════════════════ listMarkets ════════════════════
test('listMarkets returns 5 independent market objects', () => {
    const a = listMarkets();
    const b = listMarkets();
    assert.equal(a.length, 5);
    assert.notStrictEqual(a[0], b[0], 'each call returns fresh copies');
    assert.deepEqual(a, b, 'content is identical across calls');
});
