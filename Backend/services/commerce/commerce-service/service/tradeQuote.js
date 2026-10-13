'use strict';
// The money maths of a trade quote, kept pure so it can be tested without a database.
// total = value of the USDT at today's price + the intermediary's percentage fee. INR is rounded up to the whole rupee
// (a person pays whole rupees); AED and USD to the cent.
const round = (currency, n) => (currency === 'INR' ? Math.ceil(n - 1e-9) : Math.round(n * 100) / 100);
const cents = (n) => Math.round(n * 100) / 100;

function buildQuote({ usdt, currency, ratePerUsdt, feePercent, source, at, by = 'system' }) {
    const value = usdt * ratePerUsdt;
    const fee = feePercent ? (value * feePercent) / 100 : 0;
    const total = round(currency, value + fee);
    return {
        by, currency, usdt: Number(usdt), ratePerUsdt: Math.round(ratePerUsdt * 10000) / 10000,
        valueLocal: cents(value), feePercent: feePercent || 0, feeLocal: cents(fee), totalLocal: total, source: source || null, at: at || new Date().toISOString(),
    };
}

module.exports = { buildQuote, round };
