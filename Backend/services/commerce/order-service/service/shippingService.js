'use strict';
// Server-authoritative shipping cost — a client-supplied shippingAmount was previously trusted
// as-is in createOrder (only checked non-negative), the same class of trust bug the discount/tax
// fields already guard against elsewhere in this file. Deliberately simple (flat rate + a
// free-shipping threshold, both env-configurable) rather than a carrier-rate integration — no
// carrier account/API exists to integrate with, and a flat real rate is still honest (never
// fabricated) where a fake "$4.99" UI label pretending to be computed would not be.
const FLAT_RATE = Number(process.env.SHIPPING_FLAT_RATE || 5);
const FREE_THRESHOLD = Number(process.env.SHIPPING_FREE_THRESHOLD || 50);

/**
 * @param {Array<{gross:number}>} lines resolved order lines (post commerce-service pricing)
 * @returns {number} shipping cost in the order's currency, rounded to 2dp
 */
function computeShipping(lines) {
    const subtotal = lines.reduce((s, l) => s + Number(l.gross || 0), 0);
    if (Number.isFinite(FREE_THRESHOLD) && FREE_THRESHOLD >= 0 && subtotal >= FREE_THRESHOLD) return 0;
    if (!Number.isFinite(FLAT_RATE) || FLAT_RATE < 0) return 0;
    return Math.round(FLAT_RATE * 100) / 100;
}

module.exports = { computeShipping };
