'use strict';

/**
 * Channel analytics — reseller leaderboards, channel revenue, partner profitability
 * and risk scoring. Pure ranking/aggregation helpers are unit-tested; the async
 * layer queries commissions + reseller tables.
 */

const db = require('../models');
const partnerFraud = require('./partnerFraud');
const marketplaceMetrics = require('../observability/marketplaceMetrics');

const Q = db.Sequelize.QueryTypes;

/** PURE: rank entries by a numeric key descending, attach rank. */
function rankLeaderboard(entries, key = 'revenue') {
  return [...entries]
    .sort((a, b) => (Number(b[key]) || 0) - (Number(a[key]) || 0))
    .map((e, i) => ({ rank: i + 1, ...e }));
}

/** PURE: conversion rate from clicks/conversions. */
function conversionRate(clicks, conversions) {
  return clicks > 0 ? Math.round((conversions / clicks) * 10000) / 10000 : 0;
}

// ── async ─────────────────────────────────────────────────────────────────────
async function resellerLeaderboard(limit = 25) {
  const rows = await db.sequelize.query(
    `SELECT r.id AS reseller_id, r.tier,
            COALESCE(SUM(c.amount) FILTER (WHERE c.status IN ('approved','paid')),0) AS commission,
            COUNT(DISTINCT rc.customer_org_id) AS customers
     FROM reseller_orgs r
     LEFT JOIN commissions c ON c.party_type = 'reseller' AND c.party_id = r.id
     LEFT JOIN reseller_customers rc ON rc.reseller_id = r.id AND rc.status = 'active'
     WHERE r.status = 'active'
     GROUP BY r.id, r.tier ORDER BY commission DESC LIMIT :limit`,
    { replacements: { limit }, type: Q.SELECT },
  ).catch(() => []);
  return rankLeaderboard(rows.map((r) => ({ resellerId: r.reseller_id, tier: r.tier, revenue: Number(r.commission), customers: Number(r.customers) })), 'revenue');
}

async function channelRevenue(periodStart, periodEnd) {
  const [row] = await db.sequelize.query(
    `SELECT party_type, COALESCE(SUM(amount),0) AS total FROM commissions
     WHERE created_at >= :s AND created_at < :e GROUP BY party_type`,
    { replacements: { s: periodStart, e: periodEnd }, type: Q.SELECT },
  ).catch(() => [{ total: 0 }]);
  const all = await db.sequelize.query(
    `SELECT party_type, COALESCE(SUM(amount),0) AS total FROM commissions WHERE created_at >= :s AND created_at < :e GROUP BY party_type`,
    { replacements: { s: periodStart, e: periodEnd }, type: Q.SELECT },
  ).catch(() => []);
  const byType = Object.fromEntries(all.map((r) => [r.party_type, Number(r.total)]));
  return { reseller: byType.reseller || 0, affiliate: byType.affiliate || 0, total: (byType.reseller || 0) + (byType.affiliate || 0) };
}

/** Partner risk: pull live signals for a reseller and score them. */
async function resellerRisk(resellerId) {
  const [r] = await db.sequelize.query(`SELECT quota_gb, kyb_status, parent_reseller_id, margin_pct FROM reseller_orgs WHERE id = :id`, { replacements: { id: resellerId }, type: Q.SELECT });
  if (!r) return null;
  const [alloc] = await db.sequelize.query(
    `SELECT COALESCE(SUM(quota_gb),0) AS allocated, COUNT(*) AS customers FROM reseller_customers WHERE reseller_id = :id AND status = 'active'`,
    { replacements: { id: resellerId }, type: Q.SELECT },
  ).catch(() => [{ allocated: 0, customers: 0 }]);
  const score = partnerFraud.resellerFraudScore({
    quotaAllocatedRatio: r.quota_gb ? Number(alloc.allocated) / Number(r.quota_gb) : 0,
    customers: Number(alloc.customers),
    kybApproved: r.kyb_status === 'approved',
  });
  marketplaceMetrics.setPartnerMargin(String(resellerId), Number(r.margin_pct));
  return { resellerId, ...score };
}

module.exports = { rankLeaderboard, conversionRate, resellerLeaderboard, channelRevenue, resellerRisk };
