'use strict';
/**
 * Duty ledger + FX — verification harness (Phase 5).
 *
 * This is money, so the assertions are about exactness and about refusing
 * movements rather than clamping them. An account that quietly goes negative
 * produces a payment refused at the authority — the same rejection loop,
 * arriving through the money instead of the paperwork.
 *
 *   node tests/duty-settlement.verify.js
 */
const assert = require('assert');
const L = require('../service/duty/ledger');
const fx = require('../service/duty/fx');

let pass = 0;
let fail = 0;
const failures = [];
function t(name, fn) {
    try { fn(); pass += 1; console.log(`  ✓ ${name}`); }
    catch (err) { fail += 1; failures.push({ name, message: err.message }); console.log(`  ✗ ${name}\n      ${err.message}`); }
}
function section(title) { console.log(`\n${title}`); }

const NOW = new Date('2026-09-05T00:00:00Z');
const acct = (over = {}) => L.stateOf({ balance_minor: 1000000, reserved_minor: 0, credit_limit_minor: 0, currency: 'USD', ...over });
const apply = (state, ...entries) => entries.reduce((s, e) => L.applyEntry(s, e), state);
const e = (type, amount_minor) => ({ type, amount_minor });

(() => {
    // ── reserve / settle discipline ──────────────────────────────────────────
    section('reserve, settle, release');
    t('a reservation holds funds without moving the balance', () => {
        const s = apply(acct(), e('reserve', 400000));
        assert.strictEqual(s.balance_minor, 1000000);
        assert.strictEqual(s.reserved_minor, 400000);
        assert.strictEqual(L.availableOf(s), 600000);
    });
    t('settlement consumes both the reservation and the balance', () => {
        const s = apply(acct(), e('reserve', 400000), e('settle', 400000));
        assert.strictEqual(s.balance_minor, 600000);
        assert.strictEqual(s.reserved_minor, 0);
    });
    t('releasing an assessment returns the funds to available', () => {
        const s = apply(acct(), e('reserve', 400000), e('release', 400000));
        assert.strictEqual(L.availableOf(s), 1000000);
        assert.strictEqual(s.reserved_minor, 0);
    });
    t('two consignments cannot reserve the same balance', () => {
        const s = apply(acct(), e('reserve', 700000));
        assert.throws(() => L.applyEntry(s, e('reserve', 700000)), (err) => err.code === 'INSUFFICIENT_FUNDS');
    });
    t('the shortfall is reported, not just the refusal', () => {
        const s = apply(acct(), e('reserve', 700000));
        try {
            L.applyEntry(s, e('reserve', 700000));
            assert.fail('should have thrown');
        } catch (err) {
            assert.strictEqual(err.details.available, 300000);
            assert.strictEqual(err.details.requested, 700000);
        }
    });
    t('settling without a reservation is refused', () => {
        assert.throws(() => L.applyEntry(acct(), e('settle', 100)), (err) => err.code === 'SETTLE_EXCEEDS_RESERVED');
    });
    t('settling more than was reserved is refused', () => {
        const s = apply(acct(), e('reserve', 100000));
        assert.throws(() => L.applyEntry(s, e('settle', 100001)), (err) => err.code === 'SETTLE_EXCEEDS_RESERVED');
    });
    t('releasing more than is reserved is refused', () => {
        const s = apply(acct(), e('reserve', 100000));
        assert.throws(() => L.applyEntry(s, e('release', 100001)), (err) => err.code === 'RELEASE_EXCEEDS_RESERVED');
    });
    t('a partial settlement leaves the remainder reserved', () => {
        const s = apply(acct(), e('reserve', 400000), e('settle', 250000));
        assert.strictEqual(s.reserved_minor, 150000);
        assert.strictEqual(s.balance_minor, 750000);
    });

    // ── credit limits ────────────────────────────────────────────────────────
    section('deferment credit');
    t('a credit limit extends available funds beyond the balance', () => {
        const s = acct({ balance_minor: 0, credit_limit_minor: 500000 });
        assert.strictEqual(L.availableOf(s), 500000);
        assert.doesNotThrow(() => L.applyEntry(s, e('reserve', 500000)));
    });
    t('a reservation still cannot exceed balance plus credit', () => {
        const s = acct({ balance_minor: 0, credit_limit_minor: 500000 });
        assert.throws(() => L.applyEntry(s, e('reserve', 500001)), (err) => err.code === 'INSUFFICIENT_FUNDS');
    });
    t('settling against credit drives the balance negative, as a deferment should', () => {
        const s = apply(acct({ balance_minor: 0, credit_limit_minor: 500000 }), e('reserve', 300000), e('settle', 300000));
        assert.strictEqual(s.balance_minor, -300000);
        assert.strictEqual(L.availableOf(s), 200000);
    });

    // ── input discipline ─────────────────────────────────────────────────────
    section('input discipline');
    t('a decimal amount is refused rather than silently truncated', () => {
        assert.throws(() => L.applyEntry(acct(), e('deposit', 150.75)), (err) => err.code === 'NON_INTEGER_AMOUNT');
    });
    t('a NaN amount is refused', () => {
        assert.throws(() => L.applyEntry(acct(), e('deposit', Number('abc'))), (err) => err.code === 'NON_INTEGER_AMOUNT');
    });
    t('an unknown entry type is refused rather than ignored', () => {
        assert.throws(() => L.applyEntry(acct(), e('withdraw', 100)), (err) => err.code === 'UNKNOWN_ENTRY_TYPE');
    });
    t('only an adjustment may carry a negative amount', () => {
        assert.throws(() => L.applyEntry(acct(), e('deposit', -100)), (err) => err.code === 'NEGATIVE_AMOUNT');
        assert.doesNotThrow(() => L.applyEntry(acct(), e('adjustment', -100)));
    });
    t('a fee cannot overdraw past the credit limit', () => {
        assert.throws(() => L.applyEntry(acct({ balance_minor: 100 }), e('fee', 200)), (err) => err.code === 'INSUFFICIENT_FUNDS');
    });

    // ── replay ───────────────────────────────────────────────────────────────
    section('replay and runway');
    t('replaying the history reproduces the balance exactly', () => {
        const entries = [e('deposit', 1000000), e('reserve', 400000), e('settle', 400000), e('deposit', 50000), e('fee', 2500)];
        const s = L.replay({ balance_minor: 0, currency: 'USD' }, entries);
        assert.strictEqual(s.balance_minor, 647500);
        assert.strictEqual(s.reserved_minor, 0);
    });
    t('runway warns before the account runs dry, not after', () => {
        const entries = Array.from({ length: 30 }, () => e('settle', 100000)); // 1000/day
        const r = L.runway(acct({ balance_minor: 200000 }), entries, { days: 30 });
        assert.strictEqual(r.daily_burn_minor, 100000);
        assert.strictEqual(r.days_of_cover, 2);
        assert.strictEqual(r.top_up_recommended, true);
    });
    t('a well-funded account is not flagged for top-up', () => {
        const entries = Array.from({ length: 30 }, () => e('settle', 100000));
        assert.strictEqual(L.runway(acct({ balance_minor: 5000000 }), entries, { days: 30 }).top_up_recommended, false);
    });
    t('an account with no settlement history reports no false burn rate', () => {
        assert.strictEqual(L.runway(acct(), [], { days: 30 }).days_of_cover, null);
    });

    // ── FX exactness ─────────────────────────────────────────────────────────
    section('FX conversion');
    const usdJpy = fx.createLock({ base_currency: 'USD', quote_currency: 'JPY', rate: 147.25, now: NOW });
    const usdKwd = fx.createLock({ base_currency: 'USD', quote_currency: 'KWD', rate: 0.3065, now: NOW });

    t('converting into a zero-decimal currency does not scale by 100', () => {
        // 1234.56 USD x 147.25 = 181788.96 JPY -> 181789 (JPY has no minor unit)
        assert.strictEqual(fx.convertWithLock(123456, usdJpy, { now: NOW }), 181789);
    });
    t('converting into a three-decimal currency keeps the third digit', () => {
        // 1234.56 USD x 0.3065 = 378.39264 KWD -> 378.393
        assert.strictEqual(fx.convertWithLock(123456, usdKwd, { now: NOW }), 378393);
    });
    t('a round trip through a three-decimal currency returns the original', () => {
        const out = fx.convertWithLock(123456, usdKwd, { now: NOW });
        assert.strictEqual(fx.convertWithLock(out, usdKwd, { now: NOW, direction: 'quote_to_base' }), 123456);
    });
    t('conversion rounds half-up rather than truncating', () => {
        const half = fx.createLock({ base_currency: 'USD', quote_currency: 'USD', rate: 1.005, now: NOW });
        // 100 minor x 1.005 = 100.5 -> 101, not 100
        assert.strictEqual(fx.convertWithLock(100, half, { now: NOW }), 101);
    });
    t('a large amount converts without float drift', () => {
        const par = fx.createLock({ base_currency: 'USD', quote_currency: 'EUR', rate: 1, now: NOW });
        const big = 987654321987;
        assert.strictEqual(fx.convertWithLock(big, par, { now: NOW }), big);
    });
    t('rate scaling survives a repeating decimal input', () => {
        const r = fx.createLock({ base_currency: 'USD', quote_currency: 'INR', rate: 83.3333333333, now: NOW });
        assert.strictEqual(fx.convertWithLock(100000, r, { now: NOW }), 8333333);
    });
    t('zero converts to zero, not to a rounding artefact', () => {
        assert.strictEqual(fx.convertWithLock(0, usdJpy, { now: NOW }), 0);
    });

    // ── lock lifecycle ───────────────────────────────────────────────────────
    section('FX lock lifecycle');
    t('an expired lock refuses to convert rather than re-quoting silently', () => {
        const later = new Date('2026-09-07T00:00:00Z');
        assert.throws(() => fx.convertWithLock(100, usdJpy, { now: later }), (err) => err.code === 'FX_LOCK_EXPIRED');
    });
    t('a lock is valid right up to its expiry', () => {
        const atExpiry = new Date(Date.parse(usdJpy.expires_at));
        assert.doesNotThrow(() => fx.convertWithLock(100, usdJpy, { now: atExpiry }));
    });
    t('a zero or negative rate is refused at lock creation', () => {
        assert.throws(() => fx.createLock({ base_currency: 'USD', quote_currency: 'EUR', rate: 0 }), (err) => err.code === 'INVALID_RATE');
        assert.throws(() => fx.createLock({ base_currency: 'USD', quote_currency: 'EUR', rate: -1 }), (err) => err.code === 'INVALID_RATE');
    });
    t('a missing currency is refused', () => {
        assert.throws(() => fx.createLock({ base_currency: 'USD', rate: 1 }), (err) => err.code === 'INVALID_PAIR');
    });
    t('slippage quantifies what a lapsed lock would have cost', () => {
        const s = fx.slippage(123456, usdJpy, 150);
        assert.strictEqual(s.locked_minor, 181789);
        assert.strictEqual(s.market_minor, 185184);
        assert.strictEqual(s.benefit_minor, 3395);
    });

    console.log(`\n${pass} passed, ${fail} failed`);
    if (fail) {
        console.log('\nFailures:');
        failures.forEach((f) => console.log(`  • ${f.name}: ${f.message}`));
        process.exit(1);
    }
})();
