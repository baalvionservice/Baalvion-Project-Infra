'use strict';
/**
 * FX rate locks — PURE (Compression, Phase 5).
 *
 * Duty is assessed in the destination's currency; the customer funds in theirs.
 * Left floating, that gap becomes a second reason payment waits for a human, and
 * it is one of the quieter contributors to the baseline cycle. A rate locked at
 * booking makes the duty figure knowable before the assessment arrives.
 *
 * EXACTNESS. Conversion runs in BigInt. A float conversion between currencies
 * with different minor units (USD 2 → JPY 0 → KWD 3) drifts, and a duty payment
 * that is one unit off the assessment is refused at the authority — the same
 * rejection loop, arriving through the money instead of the paperwork.
 *
 * Rates are stored as integers scaled by RATE_SCALE rather than as decimals, for
 * the same reason.
 *
 * PURE: no DB, no network, no clock beyond the injected `now`.
 */

const FX_VERSION = '1.0.0';

// 10 decimal places of rate precision — beyond any published FX quote, so the
// scaling itself never becomes the source of error.
const RATE_DECIMALS = 10;
const RATE_SCALE = 10n ** BigInt(RATE_DECIMALS);

const MINOR_UNITS = Object.freeze({
    JPY: 0, KRW: 0, VND: 0, CLP: 0, ISK: 0, XOF: 0, XAF: 0, XPF: 0, UGX: 0, RWF: 0,
    BHD: 3, IQD: 3, JOD: 3, KWD: 3, LYD: 3, OMR: 3, TND: 3,
});
const minorUnits = (currency) => {
    const c = String(currency || 'USD').toUpperCase();
    return Object.prototype.hasOwnProperty.call(MINOR_UNITS, c) ? MINOR_UNITS[c] : 2;
};

class FxError extends Error {
    constructor(code, message, details = {}) {
        super(message);
        this.code = code;
        this.details = details;
    }
}

/** Decimal rate → scaled integer, rounded half-up at the last retained digit. */
function scaleRate(rate) {
    const n = Number(rate);
    if (!Number.isFinite(n) || n <= 0) {
        throw new FxError('INVALID_RATE', 'FX rate must be a positive finite number', { rate });
    }
    // Route through a fixed-precision string so binary representation error in
    // the input literal cannot leak into the scaled integer.
    const [whole, frac = ''] = n.toFixed(RATE_DECIMALS).split('.');
    return BigInt(whole) * RATE_SCALE + BigInt(frac.padEnd(RATE_DECIMALS, '0'));
}

const unscaleRate = (scaled) => Number(scaled) / Number(RATE_SCALE);

/** Half-up division for positive BigInts — banker's rounding would under-collect. */
function divRoundHalfUp(numerator, denominator) {
    if (denominator === 0n) throw new FxError('DIVIDE_BY_ZERO', 'FX denominator is zero');
    return (numerator * 2n + denominator) / (denominator * 2n);
}

/**
 * Convert an integer minor-unit amount between currencies at a scaled rate.
 *
 * rate is expressed as "1 unit of `from` buys `rate` units of `to`".
 */
function convertMinor(amountMinor, fromCurrency, toCurrency, scaledRate) {
    const amount = BigInt(Math.trunc(Number(amountMinor) || 0));
    const fromDigits = minorUnits(fromCurrency);
    const toDigits = minorUnits(toCurrency);

    // value = amount / 10^fromDigits
    // target = value * rate * 10^toDigits
    //        = amount * scaledRate * 10^toDigits / (10^fromDigits * RATE_SCALE)
    const numerator = amount * scaledRate * (10n ** BigInt(toDigits));
    const denominator = (10n ** BigInt(fromDigits)) * RATE_SCALE;

    const negative = numerator < 0n;
    const magnitude = divRoundHalfUp(negative ? -numerator : numerator, denominator);
    return Number(negative ? -magnitude : magnitude);
}

const HOUR_MS = 3600 * 1000;

/**
 * Create a rate lock.
 *
 * A lock has a hard expiry. An expired lock is an ERROR at settlement rather
 * than a silent re-quote: converting at a stale rate under-collects, and the
 * shortfall surfaces as a bounced payment days later with no obvious cause.
 */
function createLock({
    base_currency, quote_currency, rate, ttl_hours = 24, source = 'internal', now = new Date(),
} = {}) {
    const base = String(base_currency || '').toUpperCase();
    const quote = String(quote_currency || '').toUpperCase();
    if (!base || !quote) throw new FxError('INVALID_PAIR', 'Both base and quote currencies are required');

    const scaled = scaleRate(rate);
    const lockedAt = new Date(now);
    return {
        fx_version: FX_VERSION,
        base_currency: base,
        quote_currency: quote,
        rate: unscaleRate(scaled),
        rate_scaled: scaled.toString(),
        rate_decimals: RATE_DECIMALS,
        source,
        locked_at: lockedAt.toISOString(),
        expires_at: new Date(lockedAt.getTime() + Number(ttl_hours) * HOUR_MS).toISOString(),
        ttl_hours: Number(ttl_hours),
    };
}

const isExpired = (lock, now = new Date()) => new Date(now).getTime() > Date.parse(lock.expires_at);

/** Convert using a lock, refusing outright once it has expired. */
function convertWithLock(amountMinor, lock, { now = new Date(), direction = 'base_to_quote' } = {}) {
    if (isExpired(lock, now)) {
        throw new FxError('FX_LOCK_EXPIRED',
            'The FX lock has expired. Re-quote before settling — converting at a stale rate under-collects and the shortfall surfaces later as a bounced payment.',
            { expires_at: lock.expires_at, now: new Date(now).toISOString() });
    }
    const scaled = BigInt(lock.rate_scaled);
    if (direction === 'quote_to_base') {
        // Inverse direction: divide instead of multiply, still entirely in BigInt.
        const amount = BigInt(Math.trunc(Number(amountMinor) || 0));
        const fromDigits = minorUnits(lock.quote_currency);
        const toDigits = minorUnits(lock.base_currency);
        const numerator = amount * RATE_SCALE * (10n ** BigInt(toDigits));
        const denominator = (10n ** BigInt(fromDigits)) * scaled;
        return Number(divRoundHalfUp(numerator, denominator));
    }
    return convertMinor(amountMinor, lock.base_currency, lock.quote_currency, scaled);
}

/**
 * Exposure if a lock is allowed to lapse and the market has moved. Reported so
 * the cost of a stale lock is visible before it is paid.
 */
function slippage(amountMinor, lock, currentRate) {
    const atLock = convertMinor(amountMinor, lock.base_currency, lock.quote_currency, BigInt(lock.rate_scaled));
    const atMarket = convertMinor(amountMinor, lock.base_currency, lock.quote_currency, scaleRate(currentRate));
    return {
        locked_minor: atLock,
        market_minor: atMarket,
        // Positive means the lock saved money; negative means it cost.
        benefit_minor: atMarket - atLock,
        locked_rate: lock.rate,
        market_rate: Number(currentRate),
    };
}

module.exports = {
    FX_VERSION,
    RATE_DECIMALS,
    RATE_SCALE,
    MINOR_UNITS,
    FxError,
    minorUnits,
    scaleRate,
    unscaleRate,
    convertMinor,
    createLock,
    isExpired,
    convertWithLock,
    slippage,
};
