'use strict';
/**
 * Putaway Engine — VOCABULARY + FACTORIES (Phase 3, Prompt 3: WMS Phase A).
 *
 * PURE: no DB, no I/O. Mirrors service/logistics/schema.js's role in the route
 * optimizer: the single stable vocabulary every module in the putaway engine
 * speaks — the STRATEGY ladder (which rule drives bin selection), the default
 * SCORE weights the scoring engine blends, the FAILURE_KIND taxonomy, and the
 * `normalizedCandidate()` / `putawaySuggestion()` factories every other module
 * funnels through.
 *
 * A NORMALIZED CANDIDATE — one bin considered for a putaway:
 *   {
 *     id, zoneId, warehouseId, binType, path
 *     capacityWeightKg, capacityVolumeCbm, capacityUnits
 *     usedWeightKg, usedVolumeCbm, usedUnits
 *     temperatureZone, hazardClass, abcClass, status
 *     metadata            — bin.metadata jsonb (carries oldest_receipt_at /
 *                            nearest_expiry_at for FIFO/FEFO consolidation)
 *   }
 *
 * A PUTAWAY SUGGESTION — the engine's ranked pick for one candidate:
 *   {
 *     binId, score, scoreBreakdown, reasonCodes
 *   }
 */

// ── Selection strategies — how the scoring engine ranks compatible bins. ─────
const STRATEGY = Object.freeze({
    FIFO: 'fifo',                   // consolidate with the bin holding the oldest same-type stock
    FEFO: 'fefo',                   // consolidate with the bin whose stock expires soonest
    ABC: 'abc',                     // prefer bins already classified for this item's ABC tier
    CAPACITY_FIRST: 'capacity_first', // pure best-fit capacity utilization, no consolidation affinity
});
const VALID_STRATEGIES = Object.freeze(Object.values(STRATEGY));
const DEFAULT_STRATEGY = STRATEGY.FIFO;

// Default composite-score weights. Tunable per-request without code changes.
// Sum need not be 1 — the score is relative WITHIN a request (min-max
// normalized per candidate set), same convention as the logistics scoring engine.
const DEFAULT_SCORE_WEIGHTS = Object.freeze({ capacityFit: 0.5, affinity: 0.5 });

// Target post-placement utilization band. Bins landing inside this band after
// the putaway are scored best — too empty wastes a slot, too full risks
// overflow/handling difficulty.
const TARGET_UTILIZATION_MIN = 0.6;
const TARGET_UTILIZATION_MAX = 0.9;

const BIN_STATUSES = Object.freeze(['active', 'inactive', 'blocked', 'full', 'maintenance']);
const TEMPERATURE_ZONES = Object.freeze(['ambient', 'chilled', 'frozen', 'controlled']);
const ABC_CLASSES = Object.freeze(['A', 'B', 'C']);

// ── Failure taxonomy. Drives the fallback (optimizer) + controller response. ─
const FAILURE_KIND = Object.freeze({
    // The putaway request itself is structurally invalid (missing warehouse,
    // non-positive quantity, ...). Never worth a fallback — same bad request
    // fails identically everywhere.
    VALIDATION: 'validation',
    // No bin satisfied the hard safety constraints (hazard/temperature/capacity)
    // even after the fallback layer widened the search. Terminal for the request.
    NO_CANDIDATE: 'no_candidate',
});

const ENGINE_VERSION = 'putaway-engine@1.0.0';

/** Coerce to a finite non-negative number (0 on garbage). */
function num(v) {
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : 0;
}

/**
 * Build a NORMALIZED CANDIDATE from a raw db.WarehouseBin row (or plain object).
 * @returns {object} a frozen normalized candidate
 */
function normalizedCandidate(bin = {}) {
    if (!bin.id) throw new Error('normalizedCandidate(): id is required');
    return Object.freeze({
        id: String(bin.id),
        zoneId: bin.zoneId != null ? String(bin.zoneId) : (bin.zone_id != null ? String(bin.zone_id) : null),
        warehouseId: bin.warehouseId != null ? String(bin.warehouseId) : (bin.warehouse_id != null ? String(bin.warehouse_id) : null),
        binType: bin.binType || bin.bin_type || 'bin',
        path: bin.path || null,
        capacityWeightKg: bin.capacityWeightKg != null ? Number(bin.capacityWeightKg) : (bin.capacity_weight_kg != null ? Number(bin.capacity_weight_kg) : null),
        capacityVolumeCbm: bin.capacityVolumeCbm != null ? Number(bin.capacityVolumeCbm) : (bin.capacity_volume_cbm != null ? Number(bin.capacity_volume_cbm) : null),
        capacityUnits: bin.capacityUnits != null ? Number(bin.capacityUnits) : (bin.capacity_units != null ? Number(bin.capacity_units) : null),
        usedWeightKg: num(bin.usedWeightKg != null ? bin.usedWeightKg : bin.used_weight_kg),
        usedVolumeCbm: num(bin.usedVolumeCbm != null ? bin.usedVolumeCbm : bin.used_volume_cbm),
        usedUnits: num(bin.usedUnits != null ? bin.usedUnits : bin.used_units),
        temperatureZone: bin.temperatureZone || bin.temperature_zone || null,
        hazardClass: bin.hazardClass || bin.hazard_class || null,
        abcClass: bin.abcClass || bin.abc_class || null,
        status: bin.status || 'active',
        metadata: bin.metadata || {},
    });
}

/** Build a PUTAWAY SUGGESTION envelope for one scored candidate. */
function putawaySuggestion(out = {}) {
    return Object.freeze({
        binId: out.binId,
        score: out.score != null ? Number(out.score) : null,
        scoreBreakdown: out.scoreBreakdown || null,
        reasonCodes: Object.freeze(Array.isArray(out.reasonCodes) ? out.reasonCodes : []),
    });
}

/** Build the PUTAWAY RESULT envelope — the shape the engine + controller return. */
function putawayResult(out = {}) {
    return Object.freeze({
        request: out.request || null,
        strategy: VALID_STRATEGIES.includes(out.strategy) ? out.strategy : DEFAULT_STRATEGY,
        suggestions: Object.freeze(Array.isArray(out.suggestions) ? out.suggestions : []),
        top: out.top || null,
        warnings: Object.freeze(Array.isArray(out.warnings) ? out.warnings : []),
        weights: out.weights || DEFAULT_SCORE_WEIGHTS,
        engine_version: ENGINE_VERSION,
        generated_at: out.generated_at || null,
    });
}

/** A structured putaway error. `kind` decides how the controller responds. */
class PutawayError extends Error {
    constructor({ kind, message: msg, detail = {} } = {}) {
        super(msg || `putaway ${kind || 'error'}`);
        this.name = 'PutawayError';
        this.kind = Object.values(FAILURE_KIND).includes(kind) ? kind : FAILURE_KIND.NO_CANDIDATE;
        this.detail = detail || {};
    }
}

function putawayError(kind, msg, extra = {}) {
    return new PutawayError({ kind, message: msg, ...extra });
}

module.exports = {
    STRATEGY,
    VALID_STRATEGIES,
    DEFAULT_STRATEGY,
    DEFAULT_SCORE_WEIGHTS,
    TARGET_UTILIZATION_MIN,
    TARGET_UTILIZATION_MAX,
    BIN_STATUSES,
    TEMPERATURE_ZONES,
    ABC_CLASSES,
    FAILURE_KIND,
    ENGINE_VERSION,
    num,
    normalizedCandidate,
    putawaySuggestion,
    putawayResult,
    PutawayError,
    putawayError,
};
