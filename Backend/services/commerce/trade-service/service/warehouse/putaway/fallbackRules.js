'use strict';
/**
 * Putaway Engine — constraint-relaxation FALLBACK RULES (PURE). Mirrors
 * service/logistics/fallbackRules.js's role. Hazard and temperature
 * compatibility are SAFETY-CRITICAL and are never relaxed here — only the
 * zone-hint scope and ABC stratification are eligible, in that order, each
 * step re-running the (still hazard/temperature-enforcing) compatibility
 * filter over a wider candidate pool.
 */
const { filterCompatible } = require('./compatibility');

/**
 * Progressively widen the search when the strict pass finds nothing.
 * @param {object[]} allCandidates   the full candidate pool for the warehouse (unfiltered)
 * @param {object} request           normalized request
 * @returns {{ compatible: object[], warnings: string[] }}
 */
function relaxAndRetry(allCandidates, request) {
    const warnings = [];

    if (request.zoneId) {
        const widened = filterCompatible(allCandidates, request, { ignoreZoneHint: true });
        if (widened.length > 0) {
            warnings.push(`no compatible bin in the requested zone; widened search to the whole warehouse`);
            return { compatible: widened, warnings };
        }
    }

    if (request.abcClass) {
        const widened = filterCompatible(allCandidates, request, { ignoreZoneHint: true, ignoreAbc: true });
        if (widened.length > 0) {
            warnings.push(`no bin classified for ABC tier '${request.abcClass}'; relaxed ABC stratification`);
            return { compatible: widened, warnings };
        }
    }

    warnings.push('no bin satisfies hazard/temperature/capacity constraints, even after relaxing zone scope and ABC stratification');
    return { compatible: [], warnings };
}

module.exports = { relaxAndRetry };
