'use strict';

/**
 * Billing engine — the financial source of truth.
 *
 * Reads REAL usage from TimescaleDB aggregates, applies the pricing model,
 * consumes prepaid credits, and emits an immutable, HMAC-signed invoice with
 * itemized charges. Supports prepaid + postpaid, GB + request billing, premium
 * geo pricing, taxes/GST, and overages. Razorpay is used to collect postpaid
 * invoices and dunning drives suspension.
 */

const crypto = require('crypto');
const db = require('../models');
const ts = require('./timeseriesDb');
const pricing = require('./pricing');
const quotaService = require('./quotaService');
const alertService = require('./alertService');
const domainEvents = require('./domainEvents');
const metrics = require('../observability/meteringMetrics');
const logger = require('./logger');

let razorpay = null;
try { razorpay = require('./providers/razorpayService'); } catch (_) { razorpay = null; }

const SIGNING_SECRET = require('@baalvion/auth-node').requireEnv('BILLING_SIGNING_SECRET'); // fail-closed: no weak fallback
const TAX_RATE = Number(process.env.BILLING_TAX_RATE || 0.18); // GST default
const CURRENCY = process.env.BILLING_CURRENCY || 'USD';
const DUNNING_MAX = Number(process.env.DUNNING_MAX_ATTEMPTS || 4);
const Q = db.Sequelize.QueryTypes;

function currentPeriod() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

// ── Usage + credits (REAL reads) ─────────────────────────────────────────────
async function getPeriodUsage(orgId, start, end) {
  const totals = await ts.query(
    `SELECT COALESCE(SUM(bytes_total),0)::bigint AS bytes, COALESCE(SUM(requests),0)::bigint AS requests
     FROM org_usage_daily WHERE org_id = $1 AND bucket >= $2 AND bucket < $3`,
    [orgId, start, end],
  );
  const geo = await ts.query(
    `SELECT country, COALESCE(SUM(bytes_total),0)::bigint AS bytes
     FROM geo_usage_hourly WHERE org_id = $1 AND bucket >= $2 AND bucket < $3 GROUP BY country`,
    [orgId, start, end],
  );
  const geoBytes = {};
  for (const r of geo.rows) geoBytes[r.country || ''] = Number(r.bytes);
  return {
    totalBytes: Number(totals.rows[0].bytes),
    requests: Number(totals.rows[0].requests),
    geoBytes,
  };
}

async function getPrepaidCredits(orgId) {
  const [row] = await db.sequelize.query(
    `SELECT COALESCE(SUM(amount),0) AS balance FROM credit_ledger WHERE org_id = :org`,
    { replacements: { org: orgId }, type: Q.SELECT },
  );
  return Number(row.balance || 0);
}

async function planFor(orgId) {
  const org = await db.organizations.findByPk(orgId);
  if (!org) return null;
  const plan = pricing.planPricing(org.plan_slug);
  const includedGb = Number(org.bandwidth_limit_gb) > 0 ? Number(org.bandwidth_limit_gb) : plan.includedGb;
  return { org, plan, includedGb };
}

// ── Projection (dry run) — powers "projected overage" analytics ──────────────
async function projectOverage(orgId) {
  const { start, end } = currentPeriod();
  const p = await planFor(orgId);
  if (!p) return null;
  const usage = await getPeriodUsage(orgId, start, end);
  return pricing.computeCharges({
    totalBytes: usage.totalBytes,
    geoBytes: usage.geoBytes,
    includedGb: p.includedGb,
    overagePerGb: p.plan.overagePerGb,
    requests: usage.requests,
    requestPricePer1k: p.plan.requestPricePer1k,
    taxRate: TAX_RATE,
    prepaidCredits: 0, // projection ignores credits to show gross exposure
  });
}

function sign(payload) {
  return crypto.createHmac('sha256', SIGNING_SECRET).update(JSON.stringify(payload)).digest('hex');
}

// ── Invoice generation (immutable + signed) ──────────────────────────────────
async function computeInvoice(orgId, opts = {}) {
  const { start, end } = opts.start && opts.end ? opts : currentPeriod();
  const p = await planFor(orgId);
  if (!p) throw new Error('organization not found');

  const usage = await getPeriodUsage(orgId, start, end);
  const credits = await getPrepaidCredits(orgId);

  const charges = pricing.computeCharges({
    totalBytes: usage.totalBytes,
    geoBytes: usage.geoBytes,
    includedGb: p.includedGb,
    overagePerGb: p.plan.overagePerGb,
    requests: usage.requests,
    requestPricePer1k: p.plan.requestPricePer1k,
    taxRate: TAX_RATE,
    prepaidCredits: credits,
  });

  if (opts.dryRun) return { charges, usage, period: { start, end } };

  return db.sequelize.transaction(async (tx) => {
    const signaturePayload = {
      orgId, periodStart: start.toISOString(), periodEnd: end.toISOString(),
      totalGb: charges.totalGb, subtotal: charges.subtotal, tax: charges.tax, total: charges.total,
      lineItems: charges.lineItems,
    };
    const signature = sign(signaturePayload);
    const status = charges.total <= 0 ? 'paid' : 'pending';

    const [rows] = await db.sequelize.query(
      `INSERT INTO invoices (org_id, amount, tax, total, status, issued_at, due_at,
                             period_start, period_end, kind, total_gb, currency, signature)
       VALUES (:org, :amount, :tax, :total, :status, now(), now() + interval '7 days',
               :ps, :pe, 'usage', :gb, :cur, :sig)
       RETURNING id`,
      {
        replacements: {
          org: orgId, amount: charges.subtotal, tax: charges.tax, total: charges.total, status,
          ps: start, pe: end, gb: charges.totalGb, cur: CURRENCY, sig: signature,
        },
        type: Q.INSERT, transaction: tx,
      },
    );
    const invoiceId = rows[0].id;

    for (const li of charges.lineItems) {
      await db.sequelize.query(
        `INSERT INTO usage_charges (invoice_id, org_id, kind, description, quantity, unit_price, amount)
         VALUES (:inv, :org, :kind, :desc, :qty, :unit, :amt)`,
        { replacements: { inv: invoiceId, org: orgId, kind: li.kind, desc: li.description, qty: li.quantity, unit: li.unitPrice, amt: li.amount }, type: Q.INSERT, transaction: tx },
      );
    }

    if (charges.creditsApplied > 0) {
      await db.sequelize.query(
        `INSERT INTO credit_ledger (org_id, amount, reason, ref_invoice_id)
         VALUES (:org, :amt, 'invoice_settlement', :inv)`,
        { replacements: { org: orgId, amt: -charges.creditsApplied, inv: invoiceId }, type: Q.INSERT, transaction: tx },
      );
    }

    // Immutable, signed audit record (append-only table).
    await db.sequelize.query(
      `INSERT INTO billing_audit_logs (org_id, invoice_id, action, payload, signature)
       VALUES (:org, :inv, 'invoice.issued', :payload::jsonb, :sig)`,
      { replacements: { org: orgId, inv: invoiceId, payload: JSON.stringify(signaturePayload), sig: signature }, type: Q.INSERT, transaction: tx },
    );

    logger.info(`[billing] invoice ${invoiceId} org=${orgId} total=${charges.total} ${CURRENCY}`);
    return { invoiceId, charges, signature, status, period: { start, end } };
  }).then((result) => {
    // Emit the cross-division domain event AFTER commit (best-effort; the outbox
    // pattern in @baalvion/events is the exactly-once upgrade path). Consumed by
    // analytics, notifications and audit contexts.
    domainEvents.emit.billingInvoiceGenerated({
      invoiceId: result.invoiceId, orgId,
      periodStart: start.toISOString(), periodEnd: end.toISOString(),
      totalGb: charges.totalGb, amount: charges.total, currency: CURRENCY, signature: result.signature,
    });
    // Channel: accrue reseller + affiliate commissions on the invoice revenue
    // (best-effort; no-op when the org isn't part of a reseller/affiliate chain).
    accrueChannelCommissions(orgId, result.invoiceId, charges.total, periodLabel(start)).catch((e) => logger.error('[billing] commission accrual:', e.message));
    return result;
  });
}

function periodLabel(d) { return new Date(d).toISOString().slice(0, 7); }

/** Accrue reseller-chain + affiliate commissions for an invoice (lazy-required to avoid cycles). */
async function accrueChannelCommissions(orgId, invoiceId, revenue, period) {
  try {
    const reseller = require('./resellerService');
    const partnerBilling = require('./partnerBilling');
    const affiliate = require('./affiliateService');
    const chain = await reseller.customerCommissionChain(orgId);
    if (chain.length) await partnerBilling.accrueForInvoice({ invoiceId, customerOrgId: orgId, revenue, chain, period });
    await affiliate.accrueAffiliateCommission({ referredOrgId: orgId, invoiceId, revenue, isFirstPayment: false, period });
  } catch (_) { /* channel modules optional / org not in a channel */ }
}

// ── Collection via Razorpay (postpaid) ───────────────────────────────────────
async function chargeInvoice(invoiceId) {
  const [inv] = await db.sequelize.query(
    `SELECT id, org_id, total, currency, status FROM invoices WHERE id = :id`,
    { replacements: { id: invoiceId }, type: Q.SELECT },
  );
  if (!inv) throw new Error('invoice not found');
  if (inv.status === 'paid' || Number(inv.total) <= 0) return { status: 'paid' };
  if (!razorpay) throw new Error('Razorpay not configured');

  const order = await razorpay.createOrder(
    Math.round(Number(inv.total) * 100), inv.currency || CURRENCY, `inv_${invoiceId}`,
  );
  await db.transactions.create({
    org_id: inv.org_id, gateway: 'razorpay', gateway_order_id: order.id,
    amount: Number(inv.total), currency: inv.currency || CURRENCY, status: 'created',
  }).catch((e) => logger.error('[billing] txn record failed:', e.message));

  return { invoiceId, order, status: 'pending' };
}

async function markInvoicePaid(invoiceId) {
  await db.sequelize.query(
    `UPDATE invoices SET status = 'paid' WHERE id = :id AND status <> 'paid'`,
    { replacements: { id: invoiceId }, type: Q.UPDATE },
  );
  await db.sequelize.query(
    `INSERT INTO billing_audit_logs (org_id, invoice_id, action, payload, signature)
     SELECT org_id, id, 'invoice.paid', '{}'::jsonb, '' FROM invoices WHERE id = :id`,
    { replacements: { id: invoiceId }, type: Q.INSERT },
  );
}

// ── Dunning + suspension ─────────────────────────────────────────────────────
async function recordPaymentFailure(invoiceId) {
  const [inv] = await db.sequelize.query(
    `UPDATE invoices SET dunning_attempts = COALESCE(dunning_attempts,0) + 1
     WHERE id = :id RETURNING id, org_id, dunning_attempts`,
    { replacements: { id: invoiceId }, type: Q.SELECT },
  ).then((r) => r[0] || []);

  if (!inv) return;
  metrics.incBillingFailure('payment');
  await alertService.paymentFailedAlert(inv.org_id, invoiceId, inv.dunning_attempts);

  if (Number(inv.dunning_attempts) >= DUNNING_MAX) {
    await db.organizations.update({ status: 'suspended' }, { where: { id: inv.org_id } });
    const usage = await currentUsageBytes(inv.org_id);
    await quotaService.evaluate(inv.org_id, Number.MAX_SAFE_INTEGER); // hard block
    logger.warn(`[billing] org ${inv.org_id} suspended after ${inv.dunning_attempts} failed payments (usage=${usage})`);
  }
}

async function currentUsageBytes(orgId) {
  const { start, end } = currentPeriod();
  const u = await getPeriodUsage(orgId, start, end).catch(() => ({ totalBytes: 0 }));
  return u.totalBytes;
}

function previousPeriod() {
  const n = new Date();
  const end = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1));
  const start = new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth() - 1, 1));
  return { start, end };
}

// Claim the period atomically so concurrent replicas bill it exactly once.
async function claimBillingRun(period) {
  const rows = await db.sequelize.query(
    `INSERT INTO billing_runs (period_start, period_end) VALUES (:s, :e)
     ON CONFLICT (period_start, period_end) DO NOTHING RETURNING id`,
    { replacements: { s: period.start, e: period.end }, type: Q.SELECT },
  );
  return rows.length ? rows[0].id : null;
}

// ── Monthly run (cron, idempotent across replicas) ───────────────────────────
async function runMonthlyBilling(period) {
  const p = period || previousPeriod();
  const runId = await claimBillingRun(p);
  if (!runId) {
    logger.info('[billing] period already billed — skipping');
    return { skipped: true };
  }

  const orgs = await db.organizations.findAll({ attributes: ['id'] });
  let issued = 0;
  for (const o of orgs) {
    try {
      const res = await computeInvoice(o.id, { start: p.start, end: p.end });
      if (res.charges.total > 0) {
        await chargeInvoice(res.invoiceId).catch((e) => logger.error('[billing] charge failed:', e.message));
        issued++;
      }
      await quotaService.reset(o.id); // new period: clear blocks/alerts
    } catch (err) {
      metrics.incBillingFailure('compute');
      logger.error(`[billing] run failed for org ${o.id}:`, err.message);
    }
  }

  await db.sequelize.query(
    `UPDATE billing_runs SET finished_at = now(), invoices_issued = :n, status = 'done' WHERE id = :id`,
    { replacements: { n: issued, id: runId }, type: Q.UPDATE },
  );
  logger.info(`[billing] monthly run complete — ${issued} invoices issued`);
  return { issued };
}

module.exports = {
  getPeriodUsage, getPrepaidCredits, projectOverage, computeInvoice,
  chargeInvoice, markInvoicePaid, recordPaymentFailure, runMonthlyBilling,
  currentPeriod, previousPeriod,
};
