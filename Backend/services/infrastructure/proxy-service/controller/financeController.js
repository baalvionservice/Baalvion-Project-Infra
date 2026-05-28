'use strict';

/**
 * Financial operations control plane (mounted under /v1/admin/finance,
 * platform-admin only). Reconciliation, provider cost + contracts, profitability,
 * infra-cost attribution, tax, prepaid/postpaid ledger, refunds, ERP export and
 * revenue intelligence — all backed by the real finance engines.
 */

const db = require('../models');
const billingEngine = require('../service/billingEngine');
const providerCostService = require('../service/providerCostService');
const providerCostEngine = require('../service/providerCostEngine');
const infraCostAttribution = require('../service/infraCostAttribution');
const profitabilityEngine = require('../service/profitabilityEngine');
const reconciliationEngine = require('../service/reconciliationEngine');
const providerReconciliation = require('../service/providerReconciliation');
const taxEngine = require('../service/taxEngine');
const financeLedger = require('../service/financeLedger');
const financeRiskEngine = require('../service/financeRiskEngine');
const erpExport = require('../service/erpExport');
const forecastingEngine = require('../service/forecastingEngine');
const { sendSuccess } = require('../utils/response');

const Q = db.Sequelize.QueryTypes;
const wrap = (h) => async (req, res, next) => { try { await h(req, res, next); } catch (err) { next(err); } };
const period = (req) => {
  if (req.query.start && req.query.end) return { start: new Date(req.query.start), end: new Date(req.query.end) };
  return billingEngine.currentPeriod();
};
const actor = (req) => (req.auth && (req.auth.userId || req.auth.sub)) || null;

module.exports = {
  // ─── Revenue intelligence dashboard ──────────────────────────────────────
  dashboard: wrap(async (req, res) => {
    const { start, end } = period(req);
    const margin = await providerCostService.reconcile(start, end);
    const heatmap = await profitabilityEngine.marginHeatmap('org', 50);
    const negative = heatmap.filter((h) => Number(h.margin_ratio) < 0);
    sendSuccess(req, res, {
      period: { start, end },
      revenue: margin.revenue, providerCost: margin.providerCost, infraCost: margin.infraCost,
      grossMargin: margin.grossMargin, marginRatio: margin.marginRatio, totalGb: margin.totalGb,
      providers: margin.providers, negativeMarginAccounts: negative.length, topAccounts: heatmap.slice(0, 20),
    });
  }),

  // ─── Reconciliation ──────────────────────────────────────────────────────
  runUsageReconciliation: wrap(async (req, res) => {
    const { start, end } = period(req);
    sendSuccess(req, res, await reconciliationEngine.reconcileUsageVsInvoices(start, end), 202);
  }),
  listReconciliationRuns: wrap(async (req, res) => sendSuccess(req, res, await db.sequelize.query(
    `SELECT id, kind, period_start, period_end, status, discrepancies, max_variance, finished_at
     FROM reconciliation_runs ORDER BY started_at DESC LIMIT :limit`,
    { replacements: { limit: Number(req.query.limit || 50) }, type: Q.SELECT },
  ))),
  listDiscrepancies: wrap(async (req, res) => sendSuccess(req, res, await db.sequelize.query(
    `SELECT * FROM reconciliation_discrepancies WHERE run_id = :run ORDER BY variance_pct DESC`,
    { replacements: { run: req.params.runId }, type: Q.SELECT },
  ))),
  reconcileProviderInvoice: wrap(async (req, res) => {
    const { provider, billedGb, billedAmount } = req.body;
    const { start, end } = period(req);
    sendSuccess(req, res, await providerReconciliation.reconcileProviderInvoice({ provider, periodStart: start, periodEnd: end, billedGb, billedAmount }), 202);
  }),

  // ─── Provider cost engine ────────────────────────────────────────────────
  listProviderCostModels: wrap(async (req, res) => sendSuccess(req, res, await db.sequelize.query(
    `SELECT provider, model_type, dim_key, unit_cost, currency, effective_from FROM provider_cost_models ORDER BY provider, model_type`,
    { type: Q.SELECT },
  ))),
  upsertProviderCostModel: wrap(async (req, res) => {
    const { provider, modelType, dimKey = '', unitCost, currency = 'USD' } = req.body;
    await db.sequelize.query(
      `INSERT INTO provider_cost_models (provider, model_type, dim_key, unit_cost, currency) VALUES (:p, :mt, :dk, :uc, :cur)`,
      { replacements: { p: provider, mt: modelType, dk: dimKey, uc: unitCost, cur: currency }, type: Q.INSERT },
    );
    sendSuccess(req, res, { provider, modelType }, 201);
  }),
  upsertProviderContract: wrap(async (req, res) => {
    const b = req.body;
    await db.sequelize.query(
      `INSERT INTO provider_contracts (provider, tier, monthly_commit, included_gb, overage_per_gb, min_charge, volume_discounts, currency, starts_at, ends_at)
       VALUES (:p, :tier, :commit, :inc, :ov, :min, :vd::jsonb, :cur, COALESCE(:starts, now()), :ends)`,
      { replacements: { p: b.provider, tier: b.tier || 'standard', commit: b.monthlyCommit || 0, inc: b.includedGb || 0, ov: b.overagePerGb || 0, min: b.minCharge || 0, vd: JSON.stringify(b.volumeDiscounts || []), cur: b.currency || 'USD', starts: b.startsAt || null, ends: b.endsAt || null }, type: Q.INSERT },
    );
    sendSuccess(req, res, { provider: b.provider, tier: b.tier || 'standard' }, 201);
  }),
  providerCostPreview: wrap(async (req, res) =>
    sendSuccess(req, res, await providerCostEngine.costForProvider(req.query.provider, { gb: Number(req.query.gb || 0), ips: Number(req.query.ips || 0) }))),

  // ─── Infra cost attribution ──────────────────────────────────────────────
  ingestInfraCost: wrap(async (req, res) => {
    const b = req.body;
    await db.sequelize.query(
      `INSERT INTO infra_costs (period_start, period_end, category, region, amount, currency, source)
       VALUES (:ps, :pe, :cat, :region, :amt, :cur, :src)`,
      { replacements: { ps: b.periodStart, pe: b.periodEnd, cat: b.category, region: b.region || '', amt: b.amount, cur: b.currency || 'USD', src: b.source || 'manual' }, type: Q.INSERT },
    );
    sendSuccess(req, res, { category: b.category, amount: b.amount }, 201);
  }),
  attributeInfra: wrap(async (req, res) => {
    const { start, end } = period(req);
    sendSuccess(req, res, await infraCostAttribution.attributeForPeriod(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)), 202);
  }),

  // ─── Profitability ───────────────────────────────────────────────────────
  snapshotProfitability: wrap(async (req, res) => {
    const { start, end } = period(req);
    const orgs = await profitabilityEngine.snapshotOrgProfitability(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
    const providers = await profitabilityEngine.snapshotProviderProfitability(start, end);
    sendSuccess(req, res, { orgs, providers }, 202);
  }),
  marginHeatmap: wrap(async (req, res) => sendSuccess(req, res, await profitabilityEngine.marginHeatmap(req.query.scope || 'org', Number(req.query.limit || 200)))),

  // ─── Tax ─────────────────────────────────────────────────────────────────
  taxPreview: wrap(async (req, res) => sendSuccess(req, res, await taxEngine.taxForInvoice({
    orgId: req.query.orgId, amount: Number(req.query.amount || 0), customerCountry: req.query.country, customerRegion: req.query.region, b2b: req.query.b2b === 'true',
  }))),
  upsertTaxRate: wrap(async (req, res) => {
    const b = req.body;
    await db.sequelize.query(
      `INSERT INTO tax_rates (country, region, tax_type, rate, b2b_reverse) VALUES (:c, :r, :t, :rate, :rev)`,
      { replacements: { c: String(b.country).toLowerCase(), r: (b.region || '').toLowerCase(), t: b.taxType, rate: b.rate, rev: !!b.b2bReverse }, type: Q.INSERT },
    );
    sendSuccess(req, res, { country: b.country, taxType: b.taxType }, 201);
  }),

  // ─── Ledger / prepaid-postpaid ───────────────────────────────────────────
  ledgerBalance: wrap(async (req, res) => sendSuccess(req, res, { orgId: req.params.orgId, balance: await financeLedger.getBalance(req.params.orgId) })),
  addCredit: wrap(async (req, res) => sendSuccess(req, res, await financeLedger.addCredit(req.params.orgId, Number(req.body.amount), { reason: req.body.reason, expiresAt: req.body.expiresAt }), 201)),
  adjustLedger: wrap(async (req, res) => sendSuccess(req, res, await financeLedger.adjust(req.params.orgId, Number(req.body.amount), req.body.reason || 'manual_adjustment', actor(req)), 201)),

  // ─── Refunds ─────────────────────────────────────────────────────────────
  requestRefund: wrap(async (req, res) => sendSuccess(req, res, await financeRiskEngine.requestRefund({ ...req.body, requestedBy: actor(req) }), 201)),
  decideRefund: wrap(async (req, res) => sendSuccess(req, res, await financeRiskEngine.decideRefund({ refundId: req.params.id, decision: req.body.decision, approvedBy: actor(req) }))),
  listRefunds: wrap(async (req, res) => sendSuccess(req, res, await db.sequelize.query(
    `SELECT id, org_id, invoice_id, amount, status, risk_score, created_at FROM refunds ${req.query.status ? 'WHERE status = :status' : ''} ORDER BY created_at DESC LIMIT :limit`,
    { replacements: { status: req.query.status, limit: Number(req.query.limit || 100) }, type: Q.SELECT },
  ))),

  // ─── ERP export ──────────────────────────────────────────────────────────
  erpExport: wrap(async (req, res) => {
    const { start, end } = period(req);
    const out = await erpExport.exportPeriod({ system: req.query.system || 'csv', periodStart: start, periodEnd: end, exportedBy: actor(req) });
    res.setHeader('Content-Type', out.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${out.filename}"`);
    res.send(out.content);
  }),

  // ─── Forecasting ─────────────────────────────────────────────────────────
  forecastProviderSpend: wrap(async (req, res) => sendSuccess(req, res, await forecastingEngine.forecastProviderCost(Number(req.query.horizon || 30)))),
};
