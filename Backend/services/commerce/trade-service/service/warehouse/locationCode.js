'use strict';
/**
 * Warehouse Management System, Phase A — zone/bin location-code generator.
 * Pure. Same crypto.randomBytes-prefixed convention used repo-wide for
 * reference IDs (see billOfLadingController.js's genId()). The resulting
 * string is stored on warehouse_zones.barcode / warehouse_bins.barcode (and
 * mirrored into qr_payload) and is immutable once created — reassigning it
 * would invalidate a physical label already printed.
 */
const crypto = require('crypto');

const PREFIXES = Object.freeze({ zone: 'Z', bin: 'BIN' });

/**
 * @param {'zone'|'bin'} kind
 * @returns {string} e.g. "Z-M3F8K2A1-9C4E" / "BIN-M3F8K2A1-9C4E"
 */
function generateLocationCode(kind) {
    const prefix = PREFIXES[kind] || 'LOC';
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

module.exports = { generateLocationCode, PREFIXES };
