'use strict';
// Ported verbatim from the retired session-service (Phase 2 enrichment absorption).
// Pure functions — no DB, no I/O. deviceFingerprint() yields 8 hex chars (fits varchar(16)).
const UAParser = require('ua-parser-js');

function parseDevice(userAgent) {
    if (!userAgent) return { browser: null, os: null, device: null, type: 'unknown' };
    const parser = new UAParser(userAgent);
    const result = parser.getResult();
    return {
        browser: result.browser.name ? `${result.browser.name} ${result.browser.version || ''}`.trim() : null,
        os:      result.os.name      ? `${result.os.name} ${result.os.version || ''}`.trim()      : null,
        device:  result.device.model || null,
        type:    result.device.type  || 'desktop',
    };
}

// Simple fingerprint: djb2 hash of browser + os — lightweight, no crypto module needed.
function deviceFingerprint(userAgent) {
    const { browser, os } = parseDevice(userAgent);
    const raw = `${browser}|${os}`;
    let hash = 5381;
    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
    }
    return (hash >>> 0).toString(16).padStart(8, '0');
}

module.exports = { parseDevice, deviceFingerprint };
