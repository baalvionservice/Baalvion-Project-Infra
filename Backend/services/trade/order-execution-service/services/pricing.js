'use strict';
/**
 * Pure order pricing (no I/O — unit-testable). THE money-truth core for R3.
 *
 * The order total is COMPUTED here from the lines + duty/tax + FX — never accepted from the
 * client. The controller resolves the live FX rate (I/O) and passes it in; everything else is
 * deterministic so the same inputs always yield the same money.
 *
 *   subtotal           = Σ round(quantity × unit_price)              (order currency)
 *   duty + import VAT   = per-line customs duty/VAT (services/tax)   (order currency)
 *   totalValue         = subtotal + dutyAmount + taxAmount           (order currency)
 *   baseCurrencyAmount = totalValue × fxRate                         (platform base, e.g. USD)
 *
 * All arithmetic runs on integer minor units with the rate as an exact fraction, rounded once
 * and explicitly. The previous implementation used a float `round2` that hardcoded two
 * decimals: correct for USD and INR, a 100x error for a zero-decimal currency such as JPY and
 * a 10x one for a three-decimal currency such as KWD.
 *
 * Money fields are returned as exact decimal STRINGS — the form a DECIMAL column and a JSON
 * payload both preserve without a rounding hop. `*Minor` companions carry the same values as
 * integer minor units for anything that needs to do further arithmetic.
 */
const { Money, ratioFromDecimal } = require('@baalvion/money');
const { computeLineTaxes, lineValue, ROUNDING } = require('./tax');

/** Subtotal = Σ round(quantity × unit_price). Each line rounded before summing. */
function computeSubtotal(lines, currency = 'USD') {
    const safe = Array.isArray(lines) ? lines : [];
    return safe.reduce((sum, l) => sum.add(lineValue(l, currency)), Money.zero(currency));
}

/**
 * Normalize an order-currency amount into the platform base currency.
 *
 * Crosses currencies, so it cannot use Money arithmetic directly (which forbids mixing) —
 * it takes the source's minor units, applies the rate as an exact fraction, adjusts for any
 * difference in the two currencies' exponents, and rounds once into the target currency.
 */
function convertToBase(total, baseCurrency, fxRate) {
    if (total.currency === baseCurrency) return Money.of(total.minor, baseCurrency);
    const { numerator, denominator } = ratioFromDecimal(fxRate);
    const targetExp = Money.zero(baseCurrency).exponent;
    const sourceExp = total.exponent;

    let num = total.minor * numerator;
    let den = denominator;
    if (targetExp >= sourceExp) num *= 10n ** BigInt(targetExp - sourceExp);
    else den *= 10n ** BigInt(sourceExp - targetExp);

    const { divideRound } = require('@baalvion/money');
    return Money.of(divideRound(num, den, ROUNDING), baseCurrency);
}

/**
 * Compute the full money breakdown for an order.
 * @param {object} input
 * @param {Array<{quantity:number,unit_price:number|string,hs_code?:string}>} input.lines
 * @param {string} [input.currency='USD']            order (quote) currency
 * @param {string} [input.baseCurrency='USD']        platform base currency for normalization
 * @param {string} [input.destinationCountry]        import destination (drives duty/VAT); omit = none
 * @param {number|string} [input.fxRate]             order→base rate; defaults to 1 when currencies match
 */
function computeOrderPricing(input = {}) {
    const lines = Array.isArray(input.lines) ? input.lines : [];
    const currency = String(input.currency || 'USD').toUpperCase();
    const baseCurrency = String(input.baseCurrency || 'USD').toUpperCase();
    const destinationCountry = input.destinationCountry;

    const subtotal = computeSubtotal(lines, currency);
    const { dutyAmount, taxAmount } = computeLineTaxes(lines, destinationCountry, currency);
    const totalValue = subtotal.add(dutyAmount).add(taxAmount);

    // FX: identity when currencies match; otherwise the resolved rate (default 1 if unresolved,
    // so an FX outage degrades to an auditable identity rather than zeroing the order).
    const fxRateUsed = currency === baseCurrency
        ? 1
        : (Number(input.fxRate) > 0 ? Number(input.fxRate) : 1);
    const baseCurrencyAmount = convertToBase(totalValue, baseCurrency, fxRateUsed);

    return {
        subtotal: subtotal.toDecimalString(),
        dutyAmount: dutyAmount.toDecimalString(),
        taxAmount: taxAmount.toDecimalString(),
        totalValue: totalValue.toDecimalString(),
        currency,
        baseCurrency,
        fxRateUsed,
        baseCurrencyAmount: baseCurrencyAmount.toDecimalString(),
        // Integer minor units, for anything that needs to keep computing rather than store.
        subtotalMinor: subtotal.minor.toString(),
        dutyAmountMinor: dutyAmount.minor.toString(),
        taxAmountMinor: taxAmount.minor.toString(),
        totalValueMinor: totalValue.minor.toString(),
        baseCurrencyAmountMinor: baseCurrencyAmount.minor.toString(),
        lineCount: lines.length,
    };
}

module.exports = { computeOrderPricing, computeSubtotal, convertToBase };
