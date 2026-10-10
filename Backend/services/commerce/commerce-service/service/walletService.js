'use strict';
const { QueryTypes } = require('sequelize');
const { CommerceSellerCategoryBond, sequelize } = require('../models');
const config = require('../config/appConfig');
const sellerBondService = require('./sellerBondService');

const q = (sql, replacements) => sequelize.query(sql, { type: QueryTypes.SELECT, replacements });

async function balanceOf(userId) {
    const [row] = await q('SELECT COALESCE(SUM(delta), 0)::bigint AS points FROM commerce.commerce_points_ledger WHERE user_id = :u', { u: userId });
    return Number(row.points);
}

// The buyer's wallet: points, what they're worth, the load in progress, and recent activity.
async function getWallet(userId) {
    const { perUsd, minTopupUsd, maxTopupUsd } = config.points;
    const [points, ledger, topups] = await Promise.all([
        balanceOf(userId),
        q(`SELECT id, delta::bigint AS delta, reason, order_number AS "orderNumber", note, created_at AS "createdAt"
             FROM commerce.commerce_points_ledger WHERE user_id = :u ORDER BY created_at DESC LIMIT 50`, { u: userId }),
        CommerceSellerCategoryBond.findAll({ where: { sellerUserId: userId, kind: 'wallet_topup' }, order: [['createdAt', 'DESC']], limit: 10 }),
    ]);
    const presented = await Promise.all(topups.map((t) => sellerBondService.presentBond(t)));
    return {
        points,
        pointsPerUsd: perUsd,
        usdValue: points / perUsd,
        minTopupUsd,
        maxTopupUsd,
        // A load that still needs the buyer or an admin to act.
        openTopup: presented.find((t) => ['awaiting_payment', 'payment_submitted'].includes(t.status)) || null,
        // Loads that are waiting, were refused, or were just credited, newest first.
        topups: presented,
        history: ledger.map((r) => ({ ...r, delta: Number(r.delta) })),
    };
}

const startTopup = (authCtx, body) => sellerBondService.createWalletTopup(authCtx, body);

// What the marketplace has received from buyers: every points purchase with who paid (member ID),
// the order, each product and the seller who owns it. This is the admin's record of "paid with the
// unique ID" and what each seller is owed.
async function adminReceipts({ limit = 100 } = {}) {
    const lim = Math.min(Number(limit) || 100, 500);
    const rows = await q(
        `SELECT l.id, l.created_at AS "createdAt", (-l.delta)::bigint AS points, l.member_number AS "buyerMemberNumber", l.order_number AS "orderNumber",
                o.id AS "orderId", o.status AS "orderStatus", o.payment_status AS "paymentStatus", o.total_amount::float AS "totalUsd",
                (SELECT json_agg(json_build_object('name', i.name, 'quantity', i.quantity, 'lineUsd', i.total::float,
                          'sellerUserId', p.created_by, 'sellerMemberNumber', mp.member_number))
                   FROM orders.orders_order_items i
                   LEFT JOIN commerce.commerce_products p ON p.id = i.product_id
                   LEFT JOIN commerce.commerce_member_profiles mp ON mp.user_id = p.created_by
                  WHERE i.order_id = o.id) AS items
           FROM commerce.commerce_points_ledger l
           JOIN orders.orders_orders o ON o.id = l.ref_id
          WHERE l.reason = 'purchase'
          ORDER BY l.created_at DESC LIMIT :lim`, { lim });
    const [totals] = await q(`SELECT COALESCE(SUM(-delta) FILTER (WHERE reason = 'purchase'), 0)::bigint AS spent,
                                     COALESCE(SUM(delta) FILTER (WHERE reason = 'topup'), 0)::bigint AS loaded,
                                     COALESCE(SUM(delta) FILTER (WHERE reason = 'refund'), 0)::bigint AS refunded,
                                     COALESCE(SUM(delta), 0)::bigint AS outstanding
                                FROM commerce.commerce_points_ledger`, {});
    return {
        pointsPerUsd: config.points.perUsd,
        totals: { spent: Number(totals.spent), loaded: Number(totals.loaded), refunded: Number(totals.refunded), outstanding: Number(totals.outstanding) },
        receipts: rows.map((r) => ({
            ...r, points: Number(r.points),
            buyerMemberNumber: r.buyerMemberNumber ? `HR-${r.buyerMemberNumber}` : null,
            items: (r.items || []).map((i) => ({ ...i, sellerMemberNumber: i.sellerMemberNumber ? `HR-${i.sellerMemberNumber}` : null })),
        })),
    };
}

module.exports = { balanceOf, getWallet, startTopup, adminReceipts };
