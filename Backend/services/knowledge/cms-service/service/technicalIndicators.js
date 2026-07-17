'use strict';
// Pure functions computing standard technical indicators from a chronological
// (oldest-first) array of closing prices. Computed locally from the same OHLC
// series already fetched for the chart — no dedicated indicator API call.

function sma(closes, period) {
    if (closes.length < period) return null;
    const slice = closes.slice(-period);
    return slice.reduce((sum, v) => sum + v, 0) / period;
}

// Wilder's smoothing method — the standard RSI formula (matches TradingView/CNBC).
function rsi(closes, period = 14) {
    if (closes.length < period + 1) return null;
    let gains = 0;
    let losses = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
        const diff = closes[i] - closes[i - 1];
        if (diff >= 0) gains += diff; else losses -= diff;
    }
    const avgGain = gains / period;
    const avgLoss = losses / period;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
}

function ema(closes, period) {
    if (closes.length < period) return null;
    const k = 2 / (period + 1);
    let emaVal = closes.slice(0, period).reduce((sum, v) => sum + v, 0) / period;
    for (let i = period; i < closes.length; i++) {
        emaVal = closes[i] * k + emaVal * (1 - k);
    }
    return emaVal;
}

// Standard 12/26/9 MACD. Needs a full EMA series (not just the latest value) to
// derive the signal line, so this recomputes the EMA path internally.
function macd(closes, fast = 12, slow = 26, signalPeriod = 9) {
    if (closes.length < slow + signalPeriod) return null;

    const emaSeries = (period) => {
        const k = 2 / (period + 1);
        const out = [];
        let val = closes.slice(0, period).reduce((s, v) => s + v, 0) / period;
        out[period - 1] = val;
        for (let i = period; i < closes.length; i++) {
            val = closes[i] * k + val * (1 - k);
            out[i] = val;
        }
        return out;
    };

    const fastSeries = emaSeries(fast);
    const slowSeries = emaSeries(slow);
    const macdSeries = [];
    for (let i = slow - 1; i < closes.length; i++) {
        macdSeries[i] = fastSeries[i] - slowSeries[i];
    }
    const macdValues = macdSeries.filter((v) => v !== undefined);
    const signal = ema(macdValues, signalPeriod);
    const macdLine = macdValues[macdValues.length - 1];
    if (signal == null || macdLine == null) return null;
    return { macdLine, signalLine: signal, histogram: macdLine - signal };
}

function computeIndicators(closes) {
    return {
        sma20: sma(closes, 20),
        sma50: sma(closes, 50),
        sma200: sma(closes, 200),
        rsi14: rsi(closes, 14),
        macd: macd(closes),
    };
}

module.exports = { sma, rsi, ema, macd, computeIndicators };
