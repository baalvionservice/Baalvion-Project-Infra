'use strict';
/**
 * Canonical Consignment (Compression, Phase 1) — public surface.
 *
 *   schema   PURE normalization + money (integer minor units, incoterm-aware
 *            customs valuation). The one place a shipment's facts are defined.
 *   derive   PURE projection of that record into the five trade documents, with
 *            a source hash so a stale document is detectable, not discovered at
 *            the border.
 *   engine   DB-backed orchestrator — persistence, regeneration, locking.
 */
module.exports = {
    schema: require('./schema'),
    derive: require('./derive'),
    engine: require('./consignmentEngine'),
};
