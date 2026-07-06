'use strict';
/**
 * Freight Management — Comparison Scoring (Phase 3, Prompt 2).
 *
 * PURE: no DB, no I/O. Scores a set of priced carrier quote items across the
 * dimensions the spec calls for (price/transit/reliability/capacity/carbon/
 * insurance/tracking quality/pickup availability/delivery accuracy/cancellation
 * policy) and blends them into one `overallScore`. Every sub-score is normalized to
 * [0,1] where HIGHER is better, so the comparison table can sort descending.
 *
 * Some dimensions have no live data source yet in this phase (capacity/schedule
 * reliability, pickup availability, delivery accuracy beyond the carrier's overall
 * performance_score, cancellation policy) — those score a documented NEUTRAL
 * default (0.6) rather than fabricating precision the platform doesn't have yet;
 * Phase 2 (schedules/capacity) replaces the placeholders with measured data without
 * a schema change (freight_comparisons already has the columns — migration 049).
 */

const NEUTRAL_SCORE = 0.6;

const DEFAULT_WEIGHTS = Object.freeze({
    price: 0.30,
    transit: 0.20,
    reliability: 0.15,
    carbon: 0.10,
    insurance: 0.05,
    trackingQuality: 0.05,
    capacity: 0.05,
    pickupAvailability: 0.04,
    deliveryAccuracy: 0.04,
    cancellationPolicy: 0.02,
});

/** Min-max normalize to [0,1], HIGHER is better for a metric where lower raw = better. */
function normalizeHigherIsBetter(value, min, max) {
    if (max <= min) return 1;
    return 1 - (value - min) / (max - min);
}

/**
 * Score one candidate's charge line + its carrier metadata against the full set of
 * candidates (for min-max normalization of price/transit/carbon).
 *
 * @param {object} item       { totalAmount, transitDays, carbonEstimateKg }
 * @param {object} carrier    a tradeops.carriers row (plain object) — nullable
 * @param {object} bounds     { minAmount, maxAmount, minTransit, maxTransit, minCarbon, maxCarbon }
 * @returns {object} the per-dimension scores + overallScore
 */
function scoreCandidate(item, carrier, bounds) {
    const priceScore = normalizeHigherIsBetter(item.totalAmount, bounds.minAmount, bounds.maxAmount);
    const transitScore = normalizeHigherIsBetter(item.transitDays, bounds.minTransit, bounds.maxTransit);
    const carbonScore = item.carbonEstimateKg != null
        ? normalizeHigherIsBetter(item.carbonEstimateKg, bounds.minCarbon, bounds.maxCarbon)
        : NEUTRAL_SCORE;

    const reliabilityScore = carrier && carrier.reliability_score != null
        ? Math.max(0, Math.min(100, Number(carrier.reliability_score))) / 100
        : NEUTRAL_SCORE;
    const insuranceScore = carrier && carrier.insurance && Number(carrier.insurance.coverage_amount) > 0 ? 1 : NEUTRAL_SCORE;
    const trackingQualityScore = carrier && carrier.tracking_api_supported ? 1 : NEUTRAL_SCORE;
    const deliveryAccuracyScore = carrier && carrier.performance_score != null
        ? Math.max(0, Math.min(100, Number(carrier.performance_score))) / 100
        : NEUTRAL_SCORE;

    // No capacity/schedule/cancellation-policy data source yet (Phase 2) — neutral.
    const capacityScore = NEUTRAL_SCORE;
    const pickupAvailabilityScore = NEUTRAL_SCORE;
    const cancellationPolicyScore = NEUTRAL_SCORE;

    const w = DEFAULT_WEIGHTS;
    const overallScore = Number((
        w.price * priceScore
        + w.transit * transitScore
        + w.reliability * reliabilityScore
        + w.carbon * carbonScore
        + w.insurance * insuranceScore
        + w.trackingQuality * trackingQualityScore
        + w.capacity * capacityScore
        + w.pickupAvailability * pickupAvailabilityScore
        + w.deliveryAccuracy * deliveryAccuracyScore
        + w.cancellationPolicy * cancellationPolicyScore
    ).toFixed(4));

    return {
        priceScore: Number(priceScore.toFixed(4)),
        transitScore: Number(transitScore.toFixed(4)),
        reliabilityScore: Number(reliabilityScore.toFixed(4)),
        capacityScore,
        carbonScore: Number(carbonScore.toFixed(4)),
        insuranceScore,
        trackingQualityScore,
        pickupAvailabilityScore,
        deliveryAccuracyScore: Number(deliveryAccuracyScore.toFixed(4)),
        cancellationPolicyScore,
        overallScore,
    };
}

/**
 * Score every candidate in a quote's item set + rank by overallScore (best first).
 * @param {Array} items    [{ carrierId, totalAmount, transitDays, carbonEstimateKg }]
 * @param {Map|object} carriersById  carrierId → carrier row
 * @returns {Array<{ carrierId, rank, ...scores }>}
 */
function scoreAndRank(items = [], carriersById = {}) {
    if (items.length === 0) return [];
    const amounts = items.map((i) => i.totalAmount);
    const transits = items.map((i) => i.transitDays || 0);
    const carbons = items.map((i) => i.carbonEstimateKg).filter((v) => v != null);
    const bounds = {
        minAmount: Math.min(...amounts), maxAmount: Math.max(...amounts),
        minTransit: Math.min(...transits), maxTransit: Math.max(...transits),
        minCarbon: carbons.length ? Math.min(...carbons) : 0, maxCarbon: carbons.length ? Math.max(...carbons) : 0,
    };
    const scored = items.map((item) => {
        const carrier = carriersById[item.carrierId] || null;
        return { carrierId: item.carrierId, ...scoreCandidate(item, carrier, bounds) };
    }).sort((a, b) => b.overallScore - a.overallScore);
    return scored.map((s, idx) => ({ ...s, rank: idx + 1 }));
}

module.exports = { DEFAULT_WEIGHTS, NEUTRAL_SCORE, normalizeHigherIsBetter, scoreCandidate, scoreAndRank };
