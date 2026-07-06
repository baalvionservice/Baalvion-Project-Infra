'use strict';
/**
 * Warehouse Management System, Phase A — QR/barcode label rendering.
 * Wraps the `qrcode` package (pure-JS, no native bindings). Takes an already
 * -generated code string (see locationCode.js) and renders it to an SVG
 * string on demand — no DB access, no image storage; the identity string is
 * the only thing persisted (warehouse_zones/warehouse_bins.qr_payload).
 */
const QRCode = require('qrcode');

/**
 * @param {string} code  the zone/bin/GRN identity string to encode
 * @returns {Promise<string>} an SVG document string
 */
async function renderLabelSvg(code) {
    if (!code) throw new Error('renderLabelSvg(): code is required');
    return QRCode.toString(code, { type: 'svg', margin: 1, errorCorrectionLevel: 'M' });
}

module.exports = { renderLabelSvg };
