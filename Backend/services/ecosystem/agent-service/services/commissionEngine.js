'use strict';

/**
 * Pure commission math (no I/O — unit-testable). Mirrors the proxy partnerBilling
 * model: a selling agent earns a direct commission per their plan, and each
 * ancestor in the agent hierarchy earns a decreasing override % of the sale.
 */

function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

/** Pick the tier rate for an amount: highest tier whose minAmount ≤ amount. */
function tierRate(tiers = [], amount) {
    const eligible = (tiers || [])
        .map((t) => ({ min: Number(t.minAmount) || 0, rate: Number(t.rate) || 0 }))
        .filter((t) => amount >= t.min)
        .sort((a, b) => a.min - b.min);
    return eligible.length ? eligible[eligible.length - 1].rate : 0;
}

/**
 * Direct commission for one sale under a plan.
 * @param {object} plan { type:'flat'|'percent'|'tiered', rate, tiers, recurring_pct }
 * @param {object} sale { amount, kind:'new'|'recurring' }
 */
function directCommission(plan, sale) {
    const amount = Math.max(0, Number(sale.amount) || 0);
    if (sale.kind === 'recurring') return round2(amount * clamp(Number(plan.recurring_pct) || 0, 0, 1));
    switch (plan.type) {
        case 'flat':   return round2(Number(plan.rate) || 0);
        case 'tiered': return round2(amount * clamp(tierRate(plan.tiers, amount), 0, 1));
        case 'percent':
        default:       return round2(amount * clamp(Number(plan.rate) || 0, 0, 1));
    }
}

/**
 * Override commissions for the ancestor chain. `overridePcts` is ordered nearest
 * ancestor first; `ancestors` is the matching ordered list of ancestor agent ids.
 * @returns [{ agentId, level, pct, amount }]
 */
function overrideCommissions({ amount, overridePcts = [], ancestors = [], maxLevels = 3 }) {
    const base = Math.max(0, Number(amount) || 0);
    const out = [];
    const n = Math.min(overridePcts.length, ancestors.length, maxLevels);
    for (let i = 0; i < n; i++) {
        const pct = clamp(Number(overridePcts[i]) || 0, 0, 1);
        if (pct <= 0) continue;
        out.push({ agentId: ancestors[i], level: i + 1, pct, amount: round2(base * pct) });
    }
    return out;
}

/** Full breakdown for a sale: the direct earner + any overrides. */
function commissionBreakdown({ plan, sale, sellingAgentId, ancestors = [], maxLevels = 3 }) {
    const direct = directCommission(plan, sale);
    const basis = sale.kind === 'recurring' ? 'recurring' : 'direct';
    const lines = [{ agentId: sellingAgentId, level: 0, basis, amount: direct }];
    for (const ov of overrideCommissions({ amount: sale.amount, overridePcts: plan.override_pcts, ancestors, maxLevels })) {
        lines.push({ agentId: ov.agentId, level: ov.level, basis: 'override', amount: ov.amount, pct: ov.pct });
    }
    const total = round2(lines.reduce((s, l) => s + l.amount, 0));
    return { lines, direct, total };
}

module.exports = { round2, tierRate, directCommission, overrideCommissions, commissionBreakdown };
