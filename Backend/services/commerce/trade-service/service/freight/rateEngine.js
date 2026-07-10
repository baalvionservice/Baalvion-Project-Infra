'use strict';
/**
 * Freight Management — RATE ENGINE (Phase 3, Prompt 2).
 *
 * Resolves a shipment's freight_rate_rules (lane / weight / volume / seasonal / peak
 * / contract / country / discount / markup — tradeops.freight_rate_rules, migration
 * 048) into a single computed rate. This is the genuine gap the research pass
 * identified: today's freight pricing (service/freight/connectors/*'s hardcoded
 * RATE_CARD + lane-hash multiplier) has no persisted, admin-editable rule table.
 *
 * Split PURE / DB-backed, mirroring quoteEngine.js (pure) + freightGateway.js
 * (DB-backed orchestrator):
 *   • selectApplicableRules() / applyRules() — pure, unit-testable without a DB.
 *   • previewRate() / resolveRate() — DB-backed: load a tenant's active rules and
 *     run them through the pure applier, optionally persisting a freight_rates row.
 *
 * Rules stack by `priority` (ascending — lower resolves/applies first). Each rule's
 * adjustment_type decides how its adjustment_value modifies the running rate:
 *   flat     → rate += adjustment_value
 *   percent  → rate += rate * (adjustment_value / 100)
 *   per_kg   → rate += adjustment_value * weightKg
 *   per_cbm  → rate += adjustment_value * volumeCbm
 */

const db = require('../../models');

/** Coerce to a finite number (0 on garbage). */
function num(v, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

/**
 * Does a rule apply to this rate context? Every rule field is a wildcard when null
 * (matches anything); a non-null field must match exactly (lane/carrier/mode) or
 * bound the numeric/date range (weight/volume/validity).
 */
function ruleApplies(rule, ctx) {
    if (rule.active === false) return false;
    if (rule.carrier_id && ctx.carrierId && rule.carrier_id !== ctx.carrierId) return false;
    if (rule.origin_code && ctx.originCode && rule.origin_code !== ctx.originCode) return false;
    if (rule.destination_code && ctx.destinationCode && rule.destination_code !== ctx.destinationCode) return false;
    if (rule.mode && ctx.mode && rule.mode !== ctx.mode) return false;

    const weight = num(ctx.weightKg, null);
    if (weight != null) {
        if (rule.min_weight_kg != null && weight < num(rule.min_weight_kg)) return false;
        if (rule.max_weight_kg != null && weight > num(rule.max_weight_kg)) return false;
    }
    const volume = num(ctx.volumeCbm, null);
    if (volume != null) {
        if (rule.min_volume_cbm != null && volume < num(rule.min_volume_cbm)) return false;
        if (rule.max_volume_cbm != null && volume > num(rule.max_volume_cbm)) return false;
    }

    const date = ctx.date ? new Date(ctx.date) : new Date();
    if (rule.valid_from && date < new Date(rule.valid_from)) return false;
    if (rule.valid_to && date > new Date(rule.valid_to)) return false;

    return true;
}

/** Filter + sort (ascending priority) the rules applicable to a rate context. */
function selectApplicableRules(rules = [], ctx = {}) {
    return rules
        .filter((r) => ruleApplies(r, ctx))
        .slice()
        .sort((a, b) => num(a.priority, 100) - num(b.priority, 100));
}

/** Apply one rule's adjustment to a running rate. Returns the delta (not the new total). */
function ruleDelta(rule, rate, ctx) {
    const value = num(rule.adjustment_value);
    switch (rule.adjustment_type) {
        case 'flat': return value;
        case 'percent': return rate * (value / 100);
        case 'per_kg': return value * num(ctx.weightKg);
        case 'per_cbm': return value * num(ctx.volumeCbm);
        default: return 0;
    }
}

/**
 * Apply a sorted set of rules to a base rate. PURE — no DB, no I/O.
 * @returns {{ baseRate, finalRate, appliedRules: [{id, ruleType, adjustmentType, adjustmentValue, delta}] }}
 */
function applyRules(baseRate, rules = [], ctx = {}) {
    let rate = num(baseRate);
    const applied = [];
    for (const rule of rules) {
        const delta = Number(ruleDelta(rule, rate, ctx).toFixed(4));
        rate += delta;
        applied.push({
            id: rule.id || null,
            ruleType: rule.rule_type,
            adjustmentType: rule.adjustment_type,
            adjustmentValue: num(rule.adjustment_value),
            delta,
        });
    }
    return {
        baseRate: Number(num(baseRate).toFixed(2)),
        finalRate: Number(Math.max(0, rate).toFixed(2)),
        appliedRules: applied,
    };
}

/**
 * Full pure computation: select applicable rules from a candidate set + apply them.
 * @returns {{ baseRate, finalRate, appliedRules }}
 */
function computeRate({ baseRate, rules = [], ...ctx } = {}) {
    const applicable = selectApplicableRules(rules, ctx);
    return applyRules(baseRate, applicable, ctx);
}

// ── DB-backed ─────────────────────────────────────────────────────────────────

/**
 * Load a tenant's active (non-deleted) rate rules eligible for a lane/mode/carrier,
 * broadly filtered at the DB layer (carrier/mode/lane exact-or-null) — the numeric
 * weight/volume/date bounds are re-checked precisely by the pure `ruleApplies()`.
 */
async function loadCandidateRules({ tenantId, carrierId = null, originCode = null, destinationCode = null, mode = null } = {}) {
    const { Op } = db.Sequelize;
    const where = {
        active: true,
        [Op.and]: [
            { [Op.or]: [{ carrier_id: null }, ...(carrierId ? [{ carrier_id: carrierId }] : [])] },
            { [Op.or]: [{ origin_code: null }, ...(originCode ? [{ origin_code: originCode }] : [])] },
            { [Op.or]: [{ destination_code: null }, ...(destinationCode ? [{ destination_code: destinationCode }] : [])] },
            { [Op.or]: [{ mode: null }, ...(mode ? [{ mode }] : [])] },
        ],
    };
    if (tenantId) where.tenant_id = tenantId;
    return db.FreightRateRule.findAll({ where, order: [['priority', 'ASC']] });
}

/**
 * Resolve a rate for a lane/carrier/weight/volume combo: load candidate rules,
 * apply them to the base rate, and return the breakdown. No persistence.
 */
async function previewRate({
    tenantId, carrierId = null, originCode = null, destinationCode = null, mode = null,
    baseRate = 0, weightKg = 0, volumeCbm = 0, date = null, fuelPct = 0,
} = {}) {
    const rows = await loadCandidateRules({ tenantId, carrierId, originCode, destinationCode, mode });
    const rules = rows.map((r) => (r.toJSON ? r.toJSON() : r));
    const ctx = { carrierId, originCode, destinationCode, mode, weightKg, volumeCbm, date };
    const result = computeRate({ baseRate, rules, ...ctx });
    const fuelSurcharge = Number((result.finalRate * num(fuelPct)).toFixed(2));
    return {
        ...result,
        fuelSurcharge,
        totalWithFuel: Number((result.finalRate + fuelSurcharge).toFixed(2)),
    };
}

/**
 * Resolve + persist a freight_rates row (source='rule_engine'). Used by the quote
 * flow so every priced carrier option has a durable rate line to audit against.
 */
async function resolveRate(input = {}) {
    const preview = await previewRate(input);
    const row = await db.FreightRate.create({
        tenant_id: input.tenantId,
        carrier_id: input.carrierId || null,
        origin_code: input.originCode || null,
        destination_code: input.destinationCode || null,
        mode: input.mode || null,
        base_rate: preview.baseRate,
        fuel_pct: num(input.fuelPct),
        computed_rate: preview.totalWithFuel,
        currency: input.currency || 'USD',
        valid_until: input.validUntil || null,
        source: 'rule_engine',
    });
    return { record: row, preview };
}

module.exports = {
    ruleApplies,
    selectApplicableRules,
    applyRules,
    computeRate,
    loadCandidateRules,
    previewRate,
    resolveRate,
};
