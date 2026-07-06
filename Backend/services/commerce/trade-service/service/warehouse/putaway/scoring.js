'use strict';
/**
 * Putaway Engine — SCORING ENGINE (PURE). Mirrors service/logistics/scoring.js's
 * role: given a compatible candidate set, min-max normalize each candidate's
 * signals WITHIN the set and blend them into one composite score (lower =
 * better), so the caller sees WHY one bin beat another, not just the verdict.
 *
 * Two signals are blended:
 *   capacityFit — how close the bin lands to the TARGET_UTILIZATION band after
 *                 this placement (too empty wastes a slot, too full risks
 *                 overflow/handling difficulty).
 *   affinity    — strategy-dependent:
 *     • same-lot match (any strategy) always wins outright (score 0) — placing
 *       new stock alongside its own lot keeps FIFO/FEFO pick order intact.
 *     • ABC: prefer bins already classified for this item's tier.
 *     • FIFO/FEFO: prefer bins with older turnover history (oldest_receipt_at /
 *       nearest_expiry_at in bin.metadata) over untouched bins — concentrates
 *       usage instead of scattering stock across fresh slots.
 *     • CAPACITY_FIRST: affinity is neutral; the score is capacityFit alone.
 */
const { STRATEGY, DEFAULT_SCORE_WEIGHTS, TARGET_UTILIZATION_MIN, TARGET_UTILIZATION_MAX } = require('./schema');

/** Fraction-full [0,1] this bin would be after adding the requested load, averaged across the dimensions the bin actually tracks capacity for. Unmeasured bins are neutral (0.5). */
function utilizationAfter(candidate, request) {
    const dims = [];
    if (candidate.capacityWeightKg != null && candidate.capacityWeightKg > 0) {
        dims.push(Math.min(1, (candidate.usedWeightKg + (request.weightKg || 0)) / candidate.capacityWeightKg));
    }
    if (candidate.capacityVolumeCbm != null && candidate.capacityVolumeCbm > 0) {
        dims.push(Math.min(1, (candidate.usedVolumeCbm + (request.volumeCbm || 0)) / candidate.capacityVolumeCbm));
    }
    if (candidate.capacityUnits != null && candidate.capacityUnits > 0) {
        dims.push(Math.min(1, (candidate.usedUnits + request.quantity) / candidate.capacityUnits));
    }
    if (dims.length === 0) return 0.5;
    return dims.reduce((s, d) => s + d, 0) / dims.length;
}

/** Distance from the target utilization band, normalized to [0,1] (0 = inside the band). */
function capacityFitScore(utilization) {
    if (utilization < TARGET_UTILIZATION_MIN) return (TARGET_UTILIZATION_MIN - utilization) / TARGET_UTILIZATION_MIN;
    if (utilization > TARGET_UTILIZATION_MAX) return Math.min(1, (utilization - TARGET_UTILIZATION_MAX) / (1 - TARGET_UTILIZATION_MAX));
    return 0;
}

function lastLotOf(candidate) {
    const md = candidate.metadata || {};
    return md.lastLotNumber || md.last_lot_number || null;
}

function recencyFieldOf(candidate, strategy) {
    const md = candidate.metadata || {};
    if (strategy === STRATEGY.FEFO) return md.nearestExpiryAt || md.nearest_expiry_at || null;
    return md.oldestReceiptAt || md.oldest_receipt_at || null;
}

/**
 * Score + rank a compatible candidate set for one putaway request.
 * @param {object[]} candidates  compatible candidates (post compatibility.filterCompatible)
 * @param {object} request       normalized request
 * @param {object} [weights]     override DEFAULT_SCORE_WEIGHTS
 * @returns {Array<{candidate, score, scoreBreakdown, reasonCodes}>} sorted best-first
 */
function rankCandidates(candidates, request, weights = DEFAULT_SCORE_WEIGHTS) {
    if (!Array.isArray(candidates) || candidates.length === 0) return [];
    const w = { ...DEFAULT_SCORE_WEIGHTS, ...(weights || {}) };
    const strategy = request.strategy;

    // Recency normalization needs the whole set (min-max), same as the
    // logistics scoring engine normalizes cost/transit across candidate routes.
    const recencyValues = candidates.map((c) => {
        const raw = recencyFieldOf(c, strategy);
        return raw ? new Date(raw).getTime() : null;
    });
    const known = recencyValues.filter((v) => v != null);
    const minT = known.length ? Math.min(...known) : 0;
    const maxT = known.length ? Math.max(...known) : 0;

    return candidates
        .map((candidate) => {
            const utilization = utilizationAfter(candidate, request);
            const capacityFit = capacityFitScore(utilization);
            const reasonCodes = [];

            let affinity;
            const sameLot = request.lotNumber && lastLotOf(candidate) === request.lotNumber;
            if (sameLot) {
                affinity = 0;
                reasonCodes.push('same_lot_consolidation');
            } else if (strategy === STRATEGY.CAPACITY_FIRST) {
                affinity = 0;
                reasonCodes.push('capacity_first');
            } else if (strategy === STRATEGY.ABC) {
                if (!request.abcClass) affinity = 0.5;
                else if (candidate.abcClass === request.abcClass) { affinity = 0; reasonCodes.push('abc_class_match'); }
                else if (!candidate.abcClass) affinity = 0.5;
                else affinity = 1;
            } else {
                // FIFO / FEFO: prefer bins with older turnover history.
                const raw = recencyFieldOf(candidate, strategy);
                if (raw == null || maxT <= minT) {
                    affinity = 1; // untouched bin — least preferred, keeps usage concentrated
                } else {
                    const t = new Date(raw).getTime();
                    affinity = (t - minT) / (maxT - minT);
                    reasonCodes.push(strategy === STRATEGY.FEFO ? 'fefo_consolidation' : 'fifo_consolidation');
                }
            }

            if (capacityFit === 0) reasonCodes.push('target_utilization_band');

            const score = Number((w.capacityFit * capacityFit + w.affinity * affinity).toFixed(6));
            return {
                candidate,
                score,
                scoreBreakdown: { capacityFit: Number(capacityFit.toFixed(4)), affinity: Number(affinity.toFixed(4)) },
                reasonCodes,
            };
        })
        .sort((a, b) => a.score - b.score);
}

module.exports = { utilizationAfter, capacityFitScore, rankCandidates };
