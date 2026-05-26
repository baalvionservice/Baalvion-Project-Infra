'use strict';

/**
 * Provider cost engine. Computes REAL provider economics across cost models
 * (per-GB, per-IP, per-ASN, geo, concurrency, request) and enterprise contracts
 * (monthly commit, included GB, tiered volume discounts, minimum charge). The
 * computation core is PURE (unit-tested); the async layer loads cost models +
 * the active contract from `provider_cost_models` / `provider_contracts`.
 *
 * This is the cost half of margin = revenue − providerCost − infra − tax.
 */

const db = require('../models');
const pricing = require('./pricing');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;
const GB = pricing.BYTES_PER_GB;

function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }

/**
 * Block (marginal) tiered overage cost. tiers = [{thresholdGb, discountPct}]:
 * beyond each threshold, that tier's discount applies to the GB in its block.
 * GB below the first threshold pay the full rate.
 */
function tieredOverageCost(gb, perGb, tiers = []) {
  if (gb <= 0 || perGb <= 0) return 0;
  const sorted = [...tiers].filter((t) => t.thresholdGb >= 0).sort((a, b) => a.thresholdGb - b.thresholdGb);
  // Build [start, discount] segments; the segment from 0 has 0 discount unless a tier starts at 0.
  const segments = [{ start: 0, discount: 0 }];
  for (const t of sorted) segments.push({ start: t.thresholdGb, discount: Math.max(0, Math.min(1, t.discountPct / 100)) });
  let cost = 0;
  for (let i = 0; i < segments.length; i++) {
    const start = segments[i].start;
    if (start >= gb) break;
    const end = i + 1 < segments.length ? Math.min(segments[i + 1].start, gb) : gb;
    const blockGb = Math.max(0, end - start);
    cost += blockGb * perGb * (1 - segments[i].discount);
  }
  return round2(cost);
}

/**
 * Compute provider cost for a usage window.
 * @param {object} usage { gb, ips, requests, concurrencyPeak, geoGb: {country: gb}, asnGb: {asn: gb} }
 * @param {object} models keyed cost rates: { perGb, perIp, perRequest, perConcurrency, geo: {country: perGb}, asn: {asn: perGb} }
 * @param {object|null} contract { monthlyCommit, includedGb, overagePerGb, minCharge, volumeDiscounts }
 */
function computeProviderCost(usage = {}, models = {}, contract = null) {
  const gb = Number(usage.gb || 0);
  const breakdown = {};

  if (contract) {
    const billableGb = Math.max(0, gb - Number(contract.includedGb || 0));
    const overage = tieredOverageCost(billableGb, Number(contract.overagePerGb || 0), contract.volumeDiscounts || []);
    const commit = Number(contract.monthlyCommit || 0);
    const total = Math.max(Number(contract.minCharge || 0), commit + overage);
    breakdown.commit = commit;
    breakdown.includedGb = Number(contract.includedGb || 0);
    breakdown.overageGb = round2(billableGb);
    breakdown.overageCost = overage;
    return { cost: round2(total), model: 'contract', breakdown };
  }

  // No contract → sum the applicable usage-based models.
  let cost = 0;
  if (models.perGb) { breakdown.gb = round2(gb * models.perGb); cost += breakdown.gb; }
  if (models.perIp && usage.ips) { breakdown.ips = round2(usage.ips * models.perIp); cost += breakdown.ips; }
  if (models.perRequest && usage.requests) { breakdown.requests = round2((usage.requests / 1000) * models.perRequest); cost += breakdown.requests; }
  if (models.perConcurrency && usage.concurrencyPeak) { breakdown.concurrency = round2(usage.concurrencyPeak * models.perConcurrency); cost += breakdown.concurrency; }
  // Geo premiums override flat per-GB for the geo-attributed slice.
  if (models.geo && usage.geoGb) {
    let geoCost = 0;
    for (const [cc, g] of Object.entries(usage.geoGb)) {
      const rate = models.geo[cc] ?? models.perGb ?? 0;
      geoCost += Number(g) * rate;
    }
    breakdown.geo = round2(geoCost);
    // geo replaces the flat per-GB component when present
    if (models.perGb) { cost -= breakdown.gb || 0; }
    cost += geoCost;
  }
  return { cost: round2(cost), model: 'usage', breakdown };
}

/** Effective $/GB (blended) — useful for margin dashboards. */
function effectiveCostPerGb(totalCost, gb) {
  return gb > 0 ? round2(totalCost / gb) : 0;
}

// ── async layer ─────────────────────────────────────────────────────────────

async function loadModels(provider) {
  const rows = await db.sequelize.query(
    `SELECT DISTINCT ON (model_type, dim_key) model_type, dim_key, unit_cost
     FROM provider_cost_models WHERE provider = :p ORDER BY model_type, dim_key, effective_from DESC`,
    { replacements: { p: provider }, type: Q.SELECT },
  ).catch(() => []);
  const m = { geo: {}, asn: {} };
  for (const r of rows) {
    const cost = Number(r.unit_cost);
    if (r.model_type === 'per_gb') m.perGb = cost;
    else if (r.model_type === 'per_ip') m.perIp = cost;
    else if (r.model_type === 'per_request') m.perRequest = cost;
    else if (r.model_type === 'concurrency') m.perConcurrency = cost;
    else if (r.model_type === 'geo') m.geo[r.dim_key] = cost;
    else if (r.model_type === 'per_asn') m.asn[r.dim_key] = cost;
  }
  return m;
}

async function loadContract(provider, at = new Date()) {
  const rows = await db.sequelize.query(
    `SELECT monthly_commit, included_gb, overage_per_gb, min_charge, volume_discounts
     FROM provider_contracts WHERE provider = :p AND starts_at <= :at AND (ends_at IS NULL OR ends_at > :at)
     ORDER BY starts_at DESC LIMIT 1`,
    { replacements: { p: provider, at }, type: Q.SELECT },
  ).catch(() => []);
  if (!rows.length) return null;
  const r = rows[0];
  return {
    monthlyCommit: Number(r.monthly_commit), includedGb: Number(r.included_gb),
    overagePerGb: Number(r.overage_per_gb), minCharge: Number(r.min_charge),
    volumeDiscounts: r.volume_discounts || [],
  };
}

/** Cost for a provider given a usage object (gb etc.). Falls back to legacy provider_costs. */
async function costForProvider(provider, usage) {
  try {
    const [models, contract] = await Promise.all([loadModels(provider), loadContract(provider)]);
    if (!contract && !models.perGb && !models.geo) {
      // Legacy fallback: provider_costs per-GB (migration 019).
      const [legacy] = await db.sequelize.query(
        `SELECT cost_per_gb FROM provider_costs WHERE provider = :p ORDER BY effective_from DESC LIMIT 1`,
        { replacements: { p: provider }, type: Q.SELECT },
      ).catch(() => [null]);
      models.perGb = legacy ? Number(legacy.cost_per_gb) : 0;
    }
    const result = computeProviderCost(usage, models, contract);
    result.effectivePerGb = effectiveCostPerGb(result.cost, usage.gb || 0);
    return result;
  } catch (err) {
    logger.error('[providerCost] failed:', err.message);
    return { cost: 0, model: 'error', breakdown: {}, effectivePerGb: 0 };
  }
}

module.exports = { tieredOverageCost, computeProviderCost, effectiveCostPerGb, costForProvider, GB };
