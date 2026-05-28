'use strict';

/**
 * Provider reconciliation platform. Compares a provider's INVOICE (GB billed +
 * amount charged) against our internal metering + the cost our provider cost
 * engine expected. Detects provider overbilling, bandwidth discrepancies, and
 * hidden surcharges (amount variance with matching GB). Persists findings to the
 * reconciliation tables. Pure detection core is unit-tested.
 */

const db = require('../models');
const ts = require('./timeseriesDb');
const providerCostEngine = require('./providerCostEngine');
const reconciliation = require('./reconciliationEngine');
const pricing = require('./pricing');
const financeMetrics = require('../observability/financeMetrics');
const logger = require('./logger');

const Q = db.Sequelize.QueryTypes;
const GB = pricing.BYTES_PER_GB;

function round2(n) { return Math.round((Number(n) + Number.EPSILON) * 100) / 100; }

/**
 * PURE. Compare provider invoice vs internal expectation. Distinguishes a
 * bandwidth discrepancy (GB mismatch) from a hidden surcharge (GB matches but
 * amount is higher than the contracted cost for that GB).
 * @returns {{gb, amount, findings: string[], overbilledAmount}}
 */
function detectOverbilling({ internalGb, expectedCost, billedGb, billedAmount }, tolerancePct = 2) {
  const findings = [];
  const gbCmp = reconciliation.classifyVariance(internalGb, billedGb, 'provider', tolerancePct);
  const amtCmp = reconciliation.classifyVariance(expectedCost, billedAmount, 'provider', tolerancePct);

  if (gbCmp.classification === 'overbilling') findings.push('bandwidth_overcount');
  if (gbCmp.classification === 'underbilling') findings.push('bandwidth_undercount');
  // Amount higher than expected while GB roughly matches → hidden surcharge.
  if (amtCmp.classification === 'overbilling' && gbCmp.classification === 'ok') findings.push('hidden_surcharge');
  if (amtCmp.classification === 'overbilling') findings.push('amount_overbilled');

  const overbilledAmount = billedAmount > expectedCost ? round2(billedAmount - expectedCost) : 0;
  return { gb: gbCmp, amount: amtCmp, findings, overbilledAmount };
}

/** Reconcile one provider's invoice for a period against internal metering. */
async function reconcileProviderInvoice({ provider, periodStart, periodEnd, billedGb, billedAmount }) {
  const usage = await ts.query(
    `SELECT COALESCE(SUM(bytes_total),0) AS bytes FROM provider_usage_daily
     WHERE provider = $1 AND bucket >= $2 AND bucket < $3`,
    [provider, periodStart, periodEnd],
  );
  const internalGb = round2(Number(usage.rows[0]?.bytes || 0) / GB);
  const expected = await providerCostEngine.costForProvider(provider, { gb: internalGb });

  const result = detectOverbilling({ internalGb, expectedCost: expected.cost, billedGb: Number(billedGb), billedAmount: Number(billedAmount) });

  const runId = await reconciliation.openRun('provider', periodStart, periodEnd, [`provider:${provider}`, 'timescale.provider_usage_daily']);
  await reconciliation.recordDiscrepancy(runId, {
    dimension: 'provider', dimKey: `${provider}:gb`, sourceA: 'internal_gb', valueA: internalGb,
    sourceB: 'provider_billed_gb', valueB: Number(billedGb), variance: result.gb.variance, variancePct: result.gb.variancePct, classification: result.gb.classification,
  });
  await reconciliation.recordDiscrepancy(runId, {
    dimension: 'provider', dimKey: `${provider}:amount`, sourceA: 'expected_cost', valueA: expected.cost,
    sourceB: 'provider_billed_amount', valueB: Number(billedAmount), variance: result.amount.variance, variancePct: result.amount.variancePct, classification: result.amount.classification,
  });
  const summary = reconciliation.summarize([result.gb, result.amount]);
  await reconciliation.closeRun(runId, summary);
  if (result.overbilledAmount > 0) financeMetrics.incProviderOverbilling(provider, result.overbilledAmount);

  logger.info(`[provider-recon] ${provider}: internal=${internalGb}GB expected=$${expected.cost} billed=${billedGb}GB $${billedAmount} findings=${result.findings.join(',') || 'none'}`);
  return { provider, runId, internalGb, expectedCost: expected.cost, billedGb: Number(billedGb), billedAmount: Number(billedAmount), ...result };
}

module.exports = { detectOverbilling, reconcileProviderInvoice };
