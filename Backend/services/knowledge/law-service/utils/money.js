'use strict';
// Pure money helpers — no DB, no env coupling (safe to unit-test in isolation).

const round2 = (n) => Math.round((Number(n || 0) + Number.EPSILON) * 100) / 100;

/** Platform-fee / net split for a gross amount at a given fee percent. */
function splitFee(amount, feePercent) {
    const gross = Number(amount || 0);
    const pct = Math.max(0, Math.min(100, Number(feePercent || 0)));
    const fee = round2((gross * pct) / 100);
    return { fee, net: round2(gross - fee) };
}

// Minimal ISO currency metadata for display + per-country defaults (multi-currency).
const CURRENCIES = {
    USD: { symbol: '$', decimals: 2 },
    EUR: { symbol: '€', decimals: 2 },
    GBP: { symbol: '£', decimals: 2 },
    INR: { symbol: '₹', decimals: 2 },
    AED: { symbol: 'AED ', decimals: 2 },
    SGD: { symbol: 'S$', decimals: 2 },
    BRL: { symbol: 'R$', decimals: 2 },
    JPY: { symbol: '¥', decimals: 0 },
};

// Default settlement currency by country (ISO alpha-2) for the global directory.
const COUNTRY_CURRENCY = {
    US: 'USD', GB: 'GBP', IN: 'INR', AE: 'AED', SG: 'SGD', DE: 'EUR',
    FR: 'EUR', ES: 'EUR', IT: 'EUR', BR: 'BRL', JP: 'JPY',
};

function currencyForCountry(code) {
    return COUNTRY_CURRENCY[String(code || '').toUpperCase()] || 'USD';
}

function formatMoney(amount, currency = 'USD') {
    const meta = CURRENCIES[currency] || CURRENCIES.USD;
    const n = Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: meta.decimals, maximumFractionDigits: meta.decimals,
    });
    return `${meta.symbol}${n}`;
}

module.exports = { round2, splitFee, formatMoney, currencyForCountry, CURRENCIES, COUNTRY_CURRENCY };
