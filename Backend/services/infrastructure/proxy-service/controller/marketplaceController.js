'use strict';

/**
 * Marketplace + reseller + affiliate control plane.
 *   /v1/marketplace/*       — catalog + quotes (org-scoped)
 *   /v1/partner/*           — reseller self-service (scoped to the caller's reseller)
 *   /v1/admin/marketplace/* — platform admin (resellers, products, promos, payouts, channel analytics)
 *   /v1/referral/track      — public affiliate click tracking
 */

const db = require('../models');
const resellerService = require('../service/resellerService');
const partnerBilling = require('../service/partnerBilling');
const affiliateService = require('../service/affiliateService');
const marketplaceService = require('../service/marketplaceService');
const payoutService = require('../service/payoutService');
const channelAnalytics = require('../service/channelAnalytics');
const partnerGovernance = require('../service/partnerGovernance');
const { sendSuccess } = require('../utils/response');

const Q = db.Sequelize.QueryTypes;
const wrap = (h) => async (req, res, next) => { try { await h(req, res, next); } catch (err) { next(err); } };
const orgOf = (req) => req.auth.organizationId || req.auth.orgId;
const actor = (req) => (req.auth && (req.auth.userId || req.auth.sub)) || null;

async function resellerOf(req) {
  const r = await resellerService.getByOrg(orgOf(req));
  if (!r) { const e = new Error('not a reseller'); e.statusCode = 403; e.code = 'NOT_A_RESELLER'; throw e; }
  return r;
}

module.exports = {
  // ─── Public catalog + quotes ─────────────────────────────────────────────
  catalog: wrap(async (req, res) => sendSuccess(req, res, await marketplaceService.listProducts({ category: req.query.category }))),
  priceSku: wrap(async (req, res) => sendSuccess(req, res, await marketplaceService.priceForSku({ sku: req.query.sku, qty: Number(req.query.qty || 1), region: req.query.region, promoCode: req.query.promo }))),
  createQuote: wrap(async (req, res) => sendSuccess(req, res, await marketplaceService.createQuote({ orgId: orgOf(req), items: req.body.items || [], region: req.body.region, promoCode: req.body.promo }), 201)),

  // ─── Public affiliate click tracking ─────────────────────────────────────
  trackReferral: wrap(async (req, res) => sendSuccess(req, res, await affiliateService.trackClick({ code: req.body.code || req.query.code, visitorId: req.body.visitorId, ipHash: hashIp(req) }))),

  // ─── Partner (reseller) self-service ─────────────────────────────────────
  partnerMe: wrap(async (req, res) => sendSuccess(req, res, await resellerOf(req))),
  partnerCustomers: wrap(async (req, res) => {
    const r = await resellerOf(req);
    const scope = await resellerService.resolveScope(r.id);
    sendSuccess(req, res, await db.sequelize.query(
      `SELECT customer_org_id, quota_gb, status, created_at FROM reseller_customers WHERE reseller_id = ANY(:ids) AND status = 'active'`,
      { replacements: { ids: scope }, type: Q.SELECT },
    ));
  }),
  partnerAddCustomer: wrap(async (req, res) => {
    const r = await resellerOf(req);
    if (req.body.country) await partnerGovernance.assertRegionAllowed(r.id, req.body.country);
    sendSuccess(req, res, await resellerService.assignCustomer({ resellerId: r.id, customerOrgId: req.body.customerOrgId, quotaGb: req.body.quotaGb, customPricing: req.body.customPricing || {}, actorId: actor(req) }), 201);
  }),
  partnerCommissions: wrap(async (req, res) => {
    const r = await resellerOf(req);
    sendSuccess(req, res, await db.sequelize.query(
      `SELECT basis, status, COALESCE(SUM(amount),0) AS amount, COUNT(*) AS n FROM commissions
       WHERE party_type = 'reseller' AND party_id = :id GROUP BY basis, status`,
      { replacements: { id: r.id }, type: Q.SELECT },
    ));
  }),
  partnerRequestPayout: wrap(async (req, res) => {
    const r = await resellerOf(req);
    sendSuccess(req, res, await payoutService.requestPayout({ partyType: 'reseller', partyId: r.id, method: req.body.method }), 201);
  }),
  partnerCreateSubReseller: wrap(async (req, res) => {
    const r = await resellerOf(req);
    sendSuccess(req, res, await resellerService.createReseller({ orgId: req.body.orgId, parentResellerId: r.id, tier: 'sub_reseller', marginPct: req.body.marginPct, actorId: actor(req) }), 201);
  }),

  // ─── Admin: resellers ────────────────────────────────────────────────────
  adminListResellers: wrap(async (req, res) => sendSuccess(req, res, await resellerService.loadAll())),
  adminCreateReseller: wrap(async (req, res) => sendSuccess(req, res, await resellerService.createReseller({ ...req.body, actorId: actor(req) }), 201)),
  adminApproveReseller: wrap(async (req, res) => sendSuccess(req, res, await partnerGovernance.approveReseller({ resellerId: req.params.id, approver: actor(req), kybApproved: req.body.kybApproved !== false }))),
  adminResellerRisk: wrap(async (req, res) => sendSuccess(req, res, await channelAnalytics.resellerRisk(req.params.id))),
  adminSetContract: wrap(async (req, res) => sendSuccess(req, res, await partnerGovernance.setContract({ resellerId: req.params.id, ...req.body }), 201)),

  // ─── Admin: products + promotions ────────────────────────────────────────
  adminUpsertProduct: wrap(async (req, res) => {
    const b = req.body;
    await db.sequelize.query(
      `INSERT INTO marketplace_products (sku, name, category, base_price, unit, currency, metadata)
       VALUES (:sku, :name, :cat, :price, :unit, :cur, :meta::jsonb)
       ON CONFLICT (sku) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, base_price=EXCLUDED.base_price, unit=EXCLUDED.unit, currency=EXCLUDED.currency, metadata=EXCLUDED.metadata`,
      { replacements: { sku: b.sku, name: b.name, cat: b.category, price: b.basePrice, unit: b.unit || 'gb', cur: b.currency || 'USD', meta: JSON.stringify(b.metadata || {}) }, type: Q.INSERT },
    );
    sendSuccess(req, res, { sku: b.sku }, 201);
  }),
  adminUpsertPromotion: wrap(async (req, res) => {
    const b = req.body;
    await db.sequelize.query(
      `INSERT INTO promotions (code, kind, value, applies_to, ends_at, max_redemptions)
       VALUES (:code, :kind, :val, :applies, :ends, :max)
       ON CONFLICT (code) DO UPDATE SET kind=EXCLUDED.kind, value=EXCLUDED.value, applies_to=EXCLUDED.applies_to, ends_at=EXCLUDED.ends_at, max_redemptions=EXCLUDED.max_redemptions, active=true`,
      { replacements: { code: b.code, kind: b.kind, val: b.value, applies: b.appliesTo || 'all', ends: b.endsAt || null, max: b.maxRedemptions || null }, type: Q.INSERT },
    );
    sendSuccess(req, res, { code: b.code }, 201);
  }),

  // ─── Admin: affiliates ───────────────────────────────────────────────────
  adminCreateAffiliate: wrap(async (req, res) => {
    const b = req.body;
    const [row] = await db.sequelize.query(
      `INSERT INTO affiliates (org_id, email, code, commission_pct, recurring_pct, attribution_window_days, payout_method)
       VALUES (:org, :email, :code, :cp, :rp, :win, :method) RETURNING id`,
      { replacements: { org: b.orgId || null, email: b.email || null, code: b.code, cp: b.commissionPct ?? 0.2, rp: b.recurringPct ?? 0, win: b.attributionWindowDays ?? 30, method: b.payoutMethod || 'manual' }, type: Q.SELECT },
    );
    sendSuccess(req, res, { affiliateId: row.id, code: b.code }, 201);
  }),

  // ─── Admin: payouts ──────────────────────────────────────────────────────
  adminListPayouts: wrap(async (req, res) => sendSuccess(req, res, await db.sequelize.query(
    `SELECT id, party_type, party_id, amount, status, risk_score, hold_reason, created_at FROM payouts ${req.query.status ? 'WHERE status = :st' : ''} ORDER BY created_at DESC LIMIT :limit`,
    { replacements: { st: req.query.status, limit: Number(req.query.limit || 100) }, type: Q.SELECT },
  ))),
  adminApprovePayout: wrap(async (req, res) => sendSuccess(req, res, await payoutService.approvePayout({ payoutId: req.params.id, approver: actor(req) }))),
  adminProcessPayouts: wrap(async (req, res) => sendSuccess(req, res, await payoutService.processApproved(), 202)),

  // ─── Admin: channel analytics ────────────────────────────────────────────
  adminLeaderboard: wrap(async (req, res) => sendSuccess(req, res, await channelAnalytics.resellerLeaderboard(Number(req.query.limit || 25)))),
  adminChannelRevenue: wrap(async (req, res) => {
    const { currentPeriod } = require('../service/billingEngine');
    const { start, end } = req.query.start && req.query.end ? { start: new Date(req.query.start), end: new Date(req.query.end) } : currentPeriod();
    sendSuccess(req, res, await channelAnalytics.channelRevenue(start, end));
  }),
};

function hashIp(req) {
  const ip = (req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
  if (!ip) return null;
  return require('crypto').createHash('sha256').update(ip).digest('hex').slice(0, 32);
}
