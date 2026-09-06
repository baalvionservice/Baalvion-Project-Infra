'use strict';
/**
 * Pure customs duty + import-VAT computation (no I/O — unit-testable).
 *
 * Schedules are representative defaults by destination country + HS chapter, ported
 * from commerce/trade-service/providers/hs.js. They are illustrative, NOT live national
 * tariff schedules — production must sync these from an authoritative source. Kept pure
 * and deterministic so order pricing is reproducible and testable.
 *
 * Duty is levied on the customs (goods) value; import VAT/GST is levied on (value + duty),
 * the standard VAT base.
 */

// Import VAT/GST by destination country.
const IMPORT_TAX = Object.freeze({ US: 0.0, EU: 0.20, IN: 0.18, CN: 0.13, GB: 0.20 });

// Duty rate by destination country + HS chapter (2-digit), with a per-country default.
const DUTY = Object.freeze({
    US: { default: 0.034, 72: 0.0, 76: 0.0, 85: 0.0, 84: 0.012, 87: 0.025, 61: 0.16, 52: 0.082, 94: 0.0, 30: 0.0, 9: 0.0 },
    EU: { default: 0.042, 72: 0.0, 85: 0.02, 84: 0.017, 87: 0.10, 61: 0.12, 30: 0.0, 9: 0.075, 22: 0.0 },
    IN: { default: 0.10, 72: 0.075, 85: 0.20, 84: 0.075, 87: 0.70, 61: 0.20, 30: 0.10, 9: 0.30, 71: 0.125 },
    CN: { default: 0.08, 72: 0.06, 85: 0.0, 84: 0.05, 87: 0.15, 61: 0.16, 30: 0.04, 9: 0.15 },
    GB: { default: 0.04, 72: 0.0, 85: 0.0, 84: 0.0, 87: 0.10, 61: 0.12, 30: 0.0, 9: 0.0 },
});

const { Money, ratioFromDecimal, divideRound } = require('@baalvion/money');

// Duty and VAT are levied on money, so they are computed on integer minor units with the rate
// as an exact fraction, and rounded once, explicitly. The old float `round2` hardcoded two
// decimals, which is wrong for a zero-decimal currency (JPY) and a three-decimal one (KWD).
const ROUNDING = 'HALF_UP';

/** Apply a decimal rate to a Money exactly. */
function applyRate(money, rate) {
    const { numerator, denominator } = ratioFromDecimal(rate);
    return money.multiplyRatio(numerator, denominator, ROUNDING);
}

const chapterOf = (hsCode) => Number(String(hsCode || '').replace(/\D/g, '').slice(0, 2)) || 0;

/** Duty rate for an HS code into a destination country. Falls back to the country default, then US. */
function dutyRate(hsCode, country) {
    const table = DUTY[String(country || '').toUpperCase()] || DUTY.US;
    const ch = chapterOf(hsCode);
    return table[ch] !== undefined ? table[ch] : table.default;
}

/**
 * Compute duty + import VAT for a single customs value.
 *
 * `value` is a Money. Amounts come back as Money so the caller can keep summing exactly;
 * conversion to a stored decimal happens once, at the edge.
 */
function computeDuty(hsCode, country, value) {
    const v = value instanceof Money ? value : Money.fromDatabaseValue(value, 'USD');
    const dRate = dutyRate(hsCode, country);
    const tRate = IMPORT_TAX[String(country || '').toUpperCase()] ?? 0;
    const dutyAmount = applyRate(v, dRate);
    // Import VAT is levied on (goods value + duty) — the standard VAT base.
    const taxAmount = applyRate(v.add(dutyAmount), tRate);
    return { dutyRate: dRate, dutyAmount, taxRate: tRate, taxAmount, total: dutyAmount.add(taxAmount) };
}

/**
 * Sum duty + import VAT across order lines. Each line's customs value is quantity × unit_price;
 * duty/tax resolved per-line by its hs_code (so a mixed-commodity order is taxed correctly).
 * Returns zeroed totals when no destination country is given (domestic / unknown → no import duty).
 */
function computeLineTaxes(lines, destinationCountry, currency = 'USD') {
    const safe = Array.isArray(lines) ? lines : [];
    const zero = Money.zero(currency);
    if (!destinationCountry) {
        return { dutyAmount: zero, taxAmount: zero, total: zero };
    }
    let dutyAmount = zero;
    let taxAmount = zero;
    for (const line of safe) {
        const value = lineValue(line, currency);
        const d = computeDuty(line.hs_code, destinationCountry, value);
        dutyAmount = dutyAmount.add(d.dutyAmount);
        taxAmount = taxAmount.add(d.taxAmount);
    }
    return { dutyAmount, taxAmount, total: dutyAmount.add(taxAmount) };
}

/**
 * A line's customs value: quantity x unit_price, rounded ONCE at the currency's precision.
 *
 * The unit price is deliberately NOT rounded first. Trade prices routinely carry more decimals
 * than the currency does — $0.333 per unit is a real quote — and rounding that to $0.33 before
 * multiplying loses $3 on a thousand units. So both factors are taken as exact fractions, the
 * product is formed in integer arithmetic, and rounding happens once on the line total. This is
 * the same invoice-line semantics the float version had, without the float.
 */
function lineValue(line, currency) {
    const unit = ratioFromDecimal(line.unit_price ?? 0);
    const qty = ratioFromDecimal(line.quantity ?? 0);
    const scale = Money.zero(currency).exponent;
    // value_minor = (unit x qty) x 10^exponent, rounded once.
    const numerator = unit.numerator * qty.numerator * 10n ** BigInt(scale);
    const denominator = unit.denominator * qty.denominator;
    return Money.of(divideRound(numerator, denominator, ROUNDING), currency);
}

module.exports = { IMPORT_TAX, DUTY, dutyRate, computeDuty, computeLineTaxes, chapterOf, lineValue, applyRate, ROUNDING };
