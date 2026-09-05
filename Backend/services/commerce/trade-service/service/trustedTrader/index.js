'use strict';
/**
 * Trusted trader (Compression, Phase 6) — public surface.
 *
 *   programmes  PURE catalogue of AEO/CTPAT-family programmes, their criteria and
 *               their mutual-recognition reach. One accreditation can cover
 *               several corridors, which decides which to pursue first.
 *   assessment  PURE readiness scoring against the published criteria, split by
 *               whether the platform or the operator owns each gap.
 *   risk        PURE examination-selection estimate and what would reduce it.
 *   engine      DB-backed orchestrator over observed history.
 *
 * Nothing here grants accreditation — an authority does that after its own audit.
 */
module.exports = {
    programmes: require('./programmes'),
    assessment: require('./assessment'),
    risk: require('./risk'),
    engine: require('./traderEngine'),
};
