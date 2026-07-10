'use strict';
/**
 * Warehouse Management System, Phase A — GRN reference-number generator.
 * Pure. Extracted to its own module (rather than inlined in the controller
 * like the repo's other genId() helpers, e.g. billOfLadingController.js) so
 * it's independently testable via tests/wms-location-code.verify.js.
 */
const crypto = require('crypto');

/** e.g. "GRN-M3F8K2A1-9C4E" */
function generateGrnNumber() {
    return `GRN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

module.exports = { generateGrnNumber };
