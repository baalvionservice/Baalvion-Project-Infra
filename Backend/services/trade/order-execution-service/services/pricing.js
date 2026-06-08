'use strict';
/**
 * Pure order pricing (no I/O — unit-testable). THE money-truth core for R3.
 *
 * The order total is COMPUTED here from the lines + duty/tax + FX — never accepted from the
 * client. The controller resolves the live FX rate (I/O) and passes it in; everything else is
 * deterministic so the same inputs always yield the same money.
 *
 *   subtotal           = Σ round2(quantity × unit_price)            (order currency)
 *   duty + import VAT   = per-line customs duty/VAT (services/tax)  (order currency)
 *   totalValue         = subtotal + dutyAmount + taxAmount          (order currency)
 *   baseCurrencyAmount = round2(totalValue × fxRate)                (platform base, e.g. USD)
 *
 * Persisting fxRateUsed + baseCurrencyAmount gives an auditable, normalized ledger so order
 * money never diverges from settlement money.
 */
const { computeLineTaxes } = require('./tax');

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

/** Subtotal = Σ round2(quantity × unit_price). Each line rounded before summing (invoice-line semantics). */
function computeSubtotal(lines) {
    const safe = Array.isArray(lines) ? lines : [];
    return round2(safe.reduce((sum, l) => sum + round2((Number(l.quantity) || 0) * (Number(l.unit_price) || 0)), 0));
}

/**
 * Compute the full money breakdown for an order.
 * @param {object} input
 * @param {Array<{quantity:number,unit_price:number,hs_code?:string}>} input.lines
 * @param {string} [input.currency='USD']            order (quote) currency
 * @param {string} [input.baseCurrency='USD']        platform base currency for normalization
 * @param {string} [input.destinationCountry]        import destination (drives duty/VAT); omit = none
 * @param {number} [input.fxRate]                    order→base rate; defaults to 1 when currencies match
 * @returns {{subtotal:number,dutyAmount:number,taxAmount:number,totalValue:number,
 *           currency:string,baseCurrency:string,fxRateUsed:number,baseCurrencyAmount:number,lineCount:number}}
 */
function computeOrderPricing(input = {}) {
    const lines = Array.isArray(input.lines) ? input.lines : [];
    const currency = String(input.currency || 'USD').toUpperCase();
    const baseCurrency = String(input.baseCurrency || 'USD').toUpperCase();
    const destinationCountry = input.destinationCountry;

    const subtotal = computeSubtotal(lines);
    const { dutyAmount, taxAmount } = computeLineTaxes(lines, destinationCountry);
    const totalValue = round2(subtotal + dutyAmount + taxAmount);

    // FX: identity when currencies match; otherwise use the resolved rate (default 1 if unresolved).
    const fxRateUsed = currency === baseCurrency ? 1 : (Number(input.fxRate) > 0 ? Number(input.fxRate) : 1);
    const baseCurrencyAmount = round2(totalValue * fxRateUsed);

    return {
        subtotal,
        dutyAmount,
        taxAmount,
        totalValue,
        currency,
        baseCurrency,
        fxRateUsed,
        baseCurrencyAmount,
        lineCount: lines.length,
    };
}

module.exports = { computeOrderPricing, computeSubtotal };
