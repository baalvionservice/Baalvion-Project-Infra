'use strict';
/**
 * Clearance compression (Phases 0 + 3) — public surface.
 *
 *   stages      PURE stage DAG, durations and critical-path model. The source of
 *               every elapsed-time number the platform quotes.
 *   ledger      DB-backed stage clock — measure before optimizing.
 *   gate        PURE parallel work front + hard gates. Turns the linear chain
 *               into a fan-out and turns a readiness score into a decision.
 *   gateEngine  DB-backed signal assembly for those gates.
 */
module.exports = {
    stages: require('./stages'),
    ledger: require('./ledger'),
    gate: require('./gate'),
    gateEngine: require('./gateEngine'),
};
