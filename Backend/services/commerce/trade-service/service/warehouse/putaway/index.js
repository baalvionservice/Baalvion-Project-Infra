'use strict';
/**
 * Putaway Engine (Phase 3, Prompt 3: WMS Phase A) — public surface.
 *
 *   schema         vocabulary (STRATEGY / FAILURE_KIND / weights) + factories (PURE)
 *   normalize      canonical putaway-request normalizer + validation (PURE)
 *   compatibility  hard hazard/temperature/capacity/zone/ABC filter (PURE)
 *   scoring        the SCORING ENGINE — capacity-fit + FIFO/FEFO/ABC affinity (PURE)
 *   fallbackRules  zone-scope + ABC-stratification relaxation FALLBACK RULES (PURE)
 *   optimizer      the PURE orchestrator — request + candidates -> ranked suggestions
 *   engine         the DB-backed orchestrator — persistence + assignment + completion
 *
 * No apiIntegration.js equivalent: unlike the freight/logistics engines, putaway
 * has no external provider to call — bin capacity is first-party data.
 */
module.exports = {
    schema: require('./schema'),
    normalize: require('./normalize'),
    compatibility: require('./compatibility'),
    scoring: require('./scoring'),
    fallbackRules: require('./fallbackRules'),
    optimizer: require('./putawayOptimizer'),
    engine: require('./putawayEngine'),
};
