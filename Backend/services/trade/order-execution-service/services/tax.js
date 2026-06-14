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

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const chapterOf = (hsCode) => Number(String(hsCode || '').replace(/\D/g, '').slice(0, 2)) || 0;

/** Duty rate for an HS code into a destination country. Falls back to the country default, then US. */
function dutyRate(hsCode, country) {
    const table = DUTY[String(country || '').toUpperCase()] || DUTY.US;
    const ch = chapterOf(hsCode);
    return table[ch] !== undefined ? table[ch] : table.default;
}

/** Compute duty + import VAT for a single customs value. */
function computeDuty(hsCode, country, value) {
    const v = Number(value) || 0;
    const dRate = dutyRate(hsCode, country);
    const tRate = IMPORT_TAX[String(country || '').toUpperCase()] ?? 0;
    const dutyAmount = round2(v * dRate);
    const taxAmount = round2((v + dutyAmount) * tRate);
    return { dutyRate: dRate, dutyAmount, taxRate: tRate, taxAmount, total: round2(dutyAmount + taxAmount) };
}

/**
 * Sum duty + import VAT across order lines. Each line's customs value is quantity × unit_price;
 * duty/tax resolved per-line by its hs_code (so a mixed-commodity order is taxed correctly).
 * Returns zeroed totals when no destination country is given (domestic / unknown → no import duty).
 */
function computeLineTaxes(lines, destinationCountry) {
    const safe = Array.isArray(lines) ? lines : [];
    if (!destinationCountry) {
        return { dutyAmount: 0, taxAmount: 0, total: 0 };
    }
    let dutyAmount = 0;
    let taxAmount = 0;
    for (const line of safe) {
        const value = (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
        const d = computeDuty(line.hs_code, destinationCountry, value);
        dutyAmount += d.dutyAmount;
        taxAmount += d.taxAmount;
    }
    dutyAmount = round2(dutyAmount);
    taxAmount = round2(taxAmount);
    return { dutyAmount, taxAmount, total: round2(dutyAmount + taxAmount) };
}

module.exports = { IMPORT_TAX, DUTY, dutyRate, computeDuty, computeLineTaxes, chapterOf };
