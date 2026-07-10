'use strict';
/**
 * Putaway Engine — PURE orchestrator (mirrors service/logistics/optimizer.js).
 * Candidates are passed in (loaded by the DB-backed engine), never queried
 * here — this keeps the module fully deterministic and unit-testable without
 * a database.
 */
const { normalizePutawayRequest } = require('./normalize');
const { filterCompatible } = require('./compatibility');
const { relaxAndRetry } = require('./fallbackRules');
const { rankCandidates } = require('./scoring');
const { normalizedCandidate, putawaySuggestion, putawayResult, FAILURE_KIND, putawayError } = require('./schema');

/**
 * @param {object} request        raw putaway request (see normalize.js)
 * @param {object[]} rawCandidates raw db.WarehouseBin rows (or plain objects) for the warehouse
 * @param {object} [options]
 * @param {object} [options.weights]
 * @param {Date|string} [options.generatedAt]
 * @returns {object} a frozen putawayResult
 */
function suggest(request, rawCandidates, options = {}) {
    const normalizedRequest = normalizePutawayRequest(request);
    const candidates = (rawCandidates || []).map(normalizedCandidate);

    let compatible = filterCompatible(candidates, normalizedRequest);
    let warnings = [];

    if (compatible.length === 0) {
        const relaxed = relaxAndRetry(candidates, normalizedRequest);
        compatible = relaxed.compatible;
        warnings = relaxed.warnings;
    }

    if (compatible.length === 0) {
        throw putawayError(FAILURE_KIND.NO_CANDIDATE, 'no bin available for this putaway request', { warnings });
    }

    const ranked = rankCandidates(compatible, normalizedRequest, options.weights);
    const suggestions = ranked.map((r) => putawaySuggestion({
        binId: r.candidate.id,
        score: r.score,
        scoreBreakdown: r.scoreBreakdown,
        reasonCodes: r.reasonCodes,
    }));

    return putawayResult({
        request: normalizedRequest,
        strategy: normalizedRequest.strategy,
        suggestions,
        top: suggestions[0] || null,
        warnings,
        weights: options.weights,
        generated_at: options.generatedAt || new Date().toISOString(),
    });
}

module.exports = { suggest };
