'use strict';
/**
 * Canonical TTL profiles (seconds) so caching is consistent platform-wide instead
 * of every service inventing its own numbers. FX is the spec's 30s live-rate standard.
 */
const TTL = Object.freeze({
    REALTIME: 5,      // near-live tickers
    FX:       30,     // FX / market rates — the platform standard
    SHORT:    30,
    DEFAULT:  60,
    MEDIUM:   300,    // 5m
    SESSION:  1800,   // 30m
    LONG:     3600,   // 1h
    DAY:      86400,
});

module.exports = { TTL };
