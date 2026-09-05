'use strict';
/**
 * Duty settlement rail (Compression, Phase 5) — public surface.
 *
 *   ledger  PURE balance reducer. Reserve / settle / release in integer minor
 *           units, with every rejection an explicit error rather than a clamp.
 *   fx      PURE rate locks and BigInt conversion — exact across currencies with
 *           different minor units, because a payment one unit off the assessment
 *           is refused.
 *   engine  DB-backed orchestrator — row-locked, idempotent money movement.
 */
module.exports = {
    ledger: require('./ledger'),
    fx: require('./fx'),
    engine: require('./dutyEngine'),
};
