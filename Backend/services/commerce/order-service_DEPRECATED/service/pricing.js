'use strict';
/**
 * Server-authoritative ORDER pricing math (pure, side-effect free → unit-testable).
 *
 * Fixes the production FX defect where the order persisted the BASE (USD) price labelled
 * with the market currency (e.g. ₹34,500 stored for a product the storefront displayed as
 * ₹28,73,900). Every line is now converted base→market currency with the EXACT same FX +
 * rounding the storefront uses (config/markets.convertFromBase), and tax is applied using
 * the market's rule (inclusive VAT/GST vs exclusive sales tax).
 *
 * Money invariants (hold for every market):
 *   line.gross = round2(unitPrice * quantity)              // what the customer sees per line
 *   inclusive:  line.tax = round2(gross - gross/(1+rate))  // tax embedded in the gross
 *               line.net = round2(gross - tax)
 *   exclusive:  line.net = gross                           // tax added on top
 *               line.tax = round2(gross * rate)
 *   order.subtotal   = Σ line.net
 *   order.taxAmount  = Σ line.tax
 *   order.total      = subtotal + taxAmount + shipping - discount
 *   ⇒ order.subtotal + order.taxAmount == Σ line.gross (== displayed line totals)
 */

const markets = require('../config/markets');

// Round to 2 decimals, EPSILON-corrected so 1.005 → 1.01 not 1.00.
function round2(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    return Math.round((x + Number.EPSILON) * 100) / 100;
}

// Round to 4 decimals (effective tax-rate audit field).
function round4(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return 0;
    return Math.round((x + Number.EPSILON) * 10000) / 10000;
}

/**
 * Resolve the per-unit price + tax rule for a base (USD) unit price in a given market.
 * - Known market  → convert base→market currency (matches storefront) + market tax rule.
 * - Unknown/no market (legacy USD path) → base price unchanged + the per-variant fallback
 *   tax rate, exclusive (preserves pre-existing behaviour for non-market orders).
 *
 * @param {number} baseUsd          base (USD) unit price from commerce pricing
 * @param {string|null} marketCode  one of us|uk|ae|in|sg, or null/unknown
 * @param {number} fallbackTaxRate  per-variant tax rate used only when no market applies
 */
function resolveUnitPricing(baseUsd, marketCode, fallbackTaxRate = 0) {
    const m = markets.getMarket(marketCode);
    if (m) {
        return {
            unitPrice: markets.convertFromBase(baseUsd, m.country),
            currencyCode: m.currency,
            taxType: m.taxType,
            taxRate: Number(m.taxRate) || 0,
            taxInclusive: !!m.taxInclusive,
        };
    }
    return {
        unitPrice: round2(baseUsd),
        currencyCode: null,
        taxType: null,
        taxRate: Number.isFinite(Number(fallbackTaxRate)) ? Number(fallbackTaxRate) : 0,
        taxInclusive: false,
    };
}

/**
 * Compute a line's gross / net / tax from a (market-currency) unit price, quantity and the
 * resolved tax rule.
 * @returns {{ gross: number, net: number, tax: number }}
 */
function computeLine(unitPrice, quantity, taxRate, taxInclusive) {
    const gross = round2(Number(unitPrice) * Number(quantity));
    const rate = Number(taxRate) || 0;
    if (taxInclusive && rate > 0) {
        const tax = round2(gross - gross / (1 + rate / 100));
        return { gross, tax, net: round2(gross - tax) };
    }
    return { gross, net: gross, tax: round2(gross * (rate / 100)) };
}

/**
 * Aggregate order-level totals from priced lines.
 * @param {Array<{gross:number, net:number, tax:number}>} lines
 * @param {number} shippingAmount  in the order currency
 * @param {number} discountAmount  in the order currency
 */
function computeOrderTotals(lines, shippingAmount = 0, discountAmount = 0) {
    const subtotal = round2(lines.reduce((s, l) => s + Number(l.net || 0), 0));
    const taxAmount = round2(lines.reduce((s, l) => s + Number(l.tax || 0), 0));
    const grossSubtotal = round2(lines.reduce((s, l) => s + Number(l.gross || 0), 0));
    const shipping = round2(Math.max(0, Number(shippingAmount) || 0));
    const discount = round2(Math.max(0, Number(discountAmount) || 0));
    const totalAmount = Math.max(0, round2(subtotal + taxAmount + shipping - discount));
    return { subtotal, taxAmount, grossSubtotal, shipping, discount, totalAmount };
}

module.exports = { round2, round4, resolveUnitPricing, computeLine, computeOrderTotals };
