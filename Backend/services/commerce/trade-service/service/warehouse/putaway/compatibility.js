'use strict';
/**
 * Putaway Engine — hard safety/capacity compatibility filter (PURE).
 * Equivalent role to service/logistics/carrierRates.js: a pure business-rule
 * module, here filtering rather than pricing. Hazard and temperature checks
 * are SAFETY-CRITICAL and never relaxed by fallbackRules.js — only the zone
 * scope and ABC stratification are eligible for relaxation.
 */

/** True if the bin's hazard designation matches the item's hazard requirement. */
function hazardCompatible(candidate, request) {
    if (request.hazardClass) return candidate.hazardClass === request.hazardClass;
    // Non-hazardous items must not be placed in a bin reserved for a hazard class.
    return !candidate.hazardClass;
}

/** True if the bin's temperature zone matches the item's temperature requirement. */
function temperatureCompatible(candidate, request) {
    const required = request.temperatureRequirement || 'ambient';
    const binZone = candidate.temperatureZone || 'ambient';
    return binZone === required;
}

/** True if the bin has enough free capacity across every dimension supplied. */
function capacityCompatible(candidate, request) {
    if (candidate.status !== 'active') return false;
    if (candidate.binType !== 'bin') return false; // leaf-level storage locations only

    if (candidate.capacityWeightKg != null && request.weightKg != null) {
        const free = candidate.capacityWeightKg - candidate.usedWeightKg;
        if (free < request.weightKg) return false;
    }
    if (candidate.capacityVolumeCbm != null && request.volumeCbm != null) {
        const free = candidate.capacityVolumeCbm - candidate.usedVolumeCbm;
        if (free < request.volumeCbm) return false;
    }
    if (candidate.capacityUnits != null) {
        const free = candidate.capacityUnits - candidate.usedUnits;
        if (free < request.quantity) return false;
    }
    return true;
}

/** True if the bin is eligible for zone-hint scoping (no hint = always true). */
function zoneCompatible(candidate, request, { ignoreZoneHint = false } = {}) {
    if (ignoreZoneHint || !request.zoneId) return true;
    return candidate.zoneId === request.zoneId;
}

/** True if the bin's ABC stratification matches the item's (no hint = always true). */
function abcCompatible(candidate, request, { ignoreAbc = false } = {}) {
    if (ignoreAbc || !request.abcClass) return true;
    return !candidate.abcClass || candidate.abcClass === request.abcClass;
}

/**
 * Filter a candidate set down to bins safe + able to hold this putaway.
 * @param {object[]} candidates  normalized candidates (schema.normalizedCandidate)
 * @param {object} request       normalized request (normalize.normalizePutawayRequest)
 * @param {object} [relax]       { ignoreZoneHint, ignoreAbc } — fallback relaxations
 * @returns {object[]} the compatible subset (new array, input untouched)
 */
function filterCompatible(candidates, request, relax = {}) {
    return (candidates || []).filter((c) =>
        hazardCompatible(c, request)
        && temperatureCompatible(c, request)
        && capacityCompatible(c, request)
        && zoneCompatible(c, request, relax)
        && abcCompatible(c, request, relax));
}

module.exports = {
    hazardCompatible,
    temperatureCompatible,
    capacityCompatible,
    zoneCompatible,
    abcCompatible,
    filterCompatible,
};
