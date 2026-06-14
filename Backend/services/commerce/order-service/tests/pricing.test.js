'use strict';
/**
 * ORDER pricing math — the FX-conversion fix.
 *
 * REGRESSION: the order used to persist the BASE (USD) price labelled with the market
 * currency (e.g. a luxury item the storefront displayed as ₹28,73,900 was saved as
 * ₹34,500 — exactly the base USD number, un-converted). These tests pin that the order
 * now prices each line in the market currency with the SAME FX + rounding the storefront
 * uses, and applies the market's inclusive/exclusive tax rule.
 *
 * Pure unit tests against service/pricing.js → no DB, no Redis. FX rates are pinned to the
 * canonical defaults BEFORE requiring the module so assertions are deterministic.
 */
process.env.FX_LIVE_FEED = 'false';
process.env.FX_USD_USD = '1';
process.env.FX_USD_GBP = '0.79';
process.env.FX_USD_AED = '3.67';
process.env.FX_USD_INR = '83.3';
process.env.FX_USD_SGD = '1.35';

const { test } = require('node:test');
const assert = require('node:assert');

const pricing = require('../service/pricing');

// ════════════════════ THE BUG: base USD must be converted to market currency ════════════
test('REGRESSION: a $34,500 item in the IN market persists ₹28,73,900, not ₹34,500', () => {
    const baseUsd = 34500;
    const unit = pricing.resolveUnitPricing(baseUsd, 'in');
    // The defect: unitPrice === baseUsd (34500). The fix: base × 83.3, rounded to nearest 100.
    assert.notEqual(unit.unitPrice, baseUsd, 'must NOT persist the un-converted base price');
    assert.equal(unit.unitPrice, 2873900, '34500 × 83.3 = 2,873,850 → nearest 100 → 2,873,900');
    assert.equal(unit.currencyCode, 'INR');
    assert.equal(unit.taxType, 'GST');
    assert.equal(unit.taxRate, 18);
    assert.equal(unit.taxInclusive, true);

    const line = pricing.computeLine(unit.unitPrice, 1, unit.taxRate, unit.taxInclusive);
    assert.equal(line.gross, 2873900, 'gross = displayed price');
    // GST 18% is INCLUSIVE: tax is the portion already inside the gross.
    assert.equal(line.tax, 438391.53);   // 2873900 - 2873900/1.18
    assert.equal(line.net, 2435508.47);  // gross - tax

    const totals = pricing.computeOrderTotals([line], 0, 0);
    assert.equal(totals.subtotal, 2435508.47);
    assert.equal(totals.taxAmount, 438391.53);
    assert.equal(totals.totalAmount, 2873900, 'grand total equals the displayed gross');
    // Invariant: subtotal + tax == displayed gross.
    assert.equal(pricing.round2(totals.subtotal + totals.taxAmount), 2873900);
});

// ════════════════════ EXCLUSIVE market (US sales tax added on top) ════════════════════
test('US sales tax is exclusive — added on top of the (un-converted) USD price', () => {
    const unit = pricing.resolveUnitPricing(100, 'us');
    assert.equal(unit.unitPrice, 100);       // USD base, rate 1
    assert.equal(unit.currencyCode, 'USD');
    assert.equal(unit.taxInclusive, false);

    const line = pricing.computeLine(unit.unitPrice, 2, unit.taxRate, unit.taxInclusive);
    assert.equal(line.gross, 200);
    assert.equal(line.net, 200);             // exclusive: net == gross
    assert.equal(line.tax, 17);              // 200 × 8.5%

    const totals = pricing.computeOrderTotals([line], 10, 0);
    assert.equal(totals.subtotal, 200);
    assert.equal(totals.taxAmount, 17);
    assert.equal(totals.totalAmount, 227);   // 200 + 17 + 10 shipping
});

// ════════════════════ INCLUSIVE market (UK VAT embedded in the converted price) ══════════
test('UK VAT is inclusive and the price is FX-converted to GBP', () => {
    const unit = pricing.resolveUnitPricing(100, 'uk');
    assert.equal(unit.unitPrice, 79);        // 100 × 0.79
    assert.equal(unit.currencyCode, 'GBP');
    assert.equal(unit.taxInclusive, true);

    const line = pricing.computeLine(unit.unitPrice, 1, unit.taxRate, unit.taxInclusive);
    assert.equal(line.gross, 79);
    assert.equal(line.tax, 13.17);           // 79 - 79/1.2
    assert.equal(line.net, 65.83);
});

test('AE uses nearest-10 rounding and inclusive 5% VAT in AED', () => {
    const unit = pricing.resolveUnitPricing(100, 'ae');
    assert.equal(unit.unitPrice, 370);       // 100 × 3.67 = 367 → nearest 10 → 370
    assert.equal(unit.currencyCode, 'AED');
    assert.equal(unit.taxInclusive, true);
});

// ════════════════════ LEGACY no-market path is preserved ════════════════════
test('no/unknown market keeps the USD base price + per-variant fallback tax, exclusive', () => {
    const unit = pricing.resolveUnitPricing(100, null, 5);
    assert.equal(unit.unitPrice, 100);
    assert.equal(unit.currencyCode, null);
    assert.equal(unit.taxRate, 5);
    assert.equal(unit.taxInclusive, false);

    const line = pricing.computeLine(unit.unitPrice, 3, unit.taxRate, unit.taxInclusive);
    assert.equal(line.gross, 300);
    assert.equal(line.net, 300);
    assert.equal(line.tax, 15);              // 300 × 5%
});

// ════════════════════ multi-line aggregation + discount ════════════════════
test('order totals aggregate multiple lines and subtract the discount', () => {
    const a = pricing.computeLine(pricing.resolveUnitPricing(100, 'us').unitPrice, 1, 8.5, false); // gross 100, tax 8.5
    const b = pricing.computeLine(pricing.resolveUnitPricing(50, 'us').unitPrice, 2, 8.5, false);  // gross 100, tax 8.5
    const totals = pricing.computeOrderTotals([a, b], 0, 25);
    assert.equal(totals.subtotal, 200);
    assert.equal(totals.taxAmount, 17);
    assert.equal(totals.grossSubtotal, 200);
    assert.equal(totals.totalAmount, 192);   // 200 + 17 - 25
});

test('totals never go negative and coerce unsafe inputs to 0', () => {
    const totals = pricing.computeOrderTotals([{ gross: 10, net: 10, tax: 0 }], -5, 9999);
    assert.equal(totals.shipping, 0, 'negative shipping coerced to 0');
    assert.equal(totals.totalAmount, 0, 'an over-large discount floors the total at 0');
});

test('round2 is EPSILON-correct (1.005 → 1.01)', () => {
    assert.equal(pricing.round2(1.005), 1.01);
    assert.equal(pricing.round2(2873900 - 2873900 / 1.18), 438391.53);
});
