'use strict';
/**
 * Corridor gate (Compression, Phase 2) — public surface.
 *
 *   matrix    PURE requirement resolution — what THIS corridor, commodity,
 *             incoterm, mode, value and party status actually require. Replaces
 *             the hardcoded global four-document list.
 *   precheck  PURE gate — would this filing be accepted? Answered before
 *             submission, with a stated fix per finding.
 *   engine    DB-backed orchestrator — rule loading, persistence, and the
 *             reconciliation that turns first-pass acceptance into a measured KPI.
 */
module.exports = {
    matrix: require('./matrix'),
    precheck: require('./precheck'),
    engine: require('./corridorEngine'),
};
