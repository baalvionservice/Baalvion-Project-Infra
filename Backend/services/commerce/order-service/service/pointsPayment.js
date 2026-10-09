'use strict';
const { QueryTypes } = require('sequelize');
const { OrdersOrder, OrdersOrderPayment, OrdersCustomer, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const config = require('../config/appConfig');
const cache = require('./cacheService');
const ledgerOutbox = require('./ledgerOutbox');
const securityAudit = require('./securityAudit');

/**
 * Paying for an order with wallet points.
 *
 * The points ledger lives in commerce-service's schema (commerce.commerce_points_ledger) and both
 * services share one Postgres, so the debit, the payment row and the "order is paid" update commit
 * in ONE transaction: a buyer can never be charged without the order being paid, or the reverse.
 * Points are whole numbers (default 100 per USD), so there are no cents or float drift.
 */
const perUsd = () => Number((config.points || {}).perUsd) || 100;

// Round UP to a whole point so the marketplace never under-collects; at 100 points per $1 a price in
// cents converts exactly.
function pointsFor(amount) {
    const cents = Math.round(Number(amount) * 100);
    if (!Number.isFinite(cents) || cents <= 0) throw new AppError('VALIDATION_ERROR', 'This order has no payable amount', 400);
    return Math.ceil((cents * perUsd()) / 100);
}

async function lockUser(t, userId) {
    // Serialises one buyer's wallet movements so two checkouts cannot spend the same points.
    await sequelize.query('SELECT pg_advisory_xact_lock(:k)', { replacements: { k: Number(userId) }, transaction: t });
}

async function balanceOf(userId, t) {
    const [r] = await sequelize.query('SELECT COALESCE(SUM(delta), 0)::bigint AS p FROM commerce.commerce_points_ledger WHERE user_id = :u', { replacements: { u: userId }, type: QueryTypes.SELECT, transaction: t });
    return Number(r.p);
}

async function memberNumberOf(userId, t) {
    const [r] = await sequelize.query('SELECT member_number FROM commerce.commerce_member_profiles WHERE user_id = :u', { replacements: { u: userId }, type: QueryTypes.SELECT, transaction: t });
    return r ? r.member_number : null;
}

// Only the buyer who owns the order may pay it. Anyone else gets the same answer as "no such order".
async function loadOwnOrder(storeId, orderId, actor) {
    if (!actor || actor.userId == null) throw new AppError('UNAUTHORIZED', 'Sign in to pay with your wallet', 401);
    const order = await OrdersOrder.findOne({ where: { id: orderId, storeId } });
    const customer = order && order.customerId ? await OrdersCustomer.findByPk(order.customerId, { attributes: ['userId'] }) : null;
    if (!order || !customer || String(customer.userId) !== String(actor.userId)) throw new AppError('NOT_FOUND', 'Order not found', 404);
    return order;
}

async function payOrder(storeId, orderId, actor) {
    const orderService = require('./orderService'); // lazy: orderService lazily requires this module for refunds
    const order = await loadOwnOrder(storeId, orderId, actor);
    if (order.paymentStatus === 'paid') return { order: order.toJSON(), alreadyPaid: true };
    if (order.paymentStatus !== 'pending') throw new AppError('CONFLICT', `This order is ${order.paymentStatus} and cannot be paid`, 409);
    if (order.status === 'cancelled') throw new AppError('CONFLICT', 'This order was cancelled', 409);
    if (order.currencyCode !== 'USD') throw new AppError('CONFLICT', 'Wallet points pay USD orders only', 409);

    const points = pointsFor(order.totalAmount);
    const txnId = `pts_${order.id}`;
    let payment;
    await sequelize.transaction(async (t) => {
        await lockUser(t, actor.userId);
        const balance = await balanceOf(actor.userId, t);
        if (balance < points) {
            throw new AppError('INSUFFICIENT_POINTS', `You need ${points.toLocaleString()} points; your wallet has ${balance.toLocaleString()}`, 402, { needed: points, balance, short: points - balance });
        }
        const member = await memberNumberOf(actor.userId, t);
        // One purchase per order: a double-click or retry hits the unique (ref_id, reason) index and is skipped.
        await sequelize.query(
            `INSERT INTO commerce.commerce_points_ledger (user_id, delta, reason, ref_id, order_number, member_number, note)
             VALUES (:u, :delta, 'purchase', :ref, :orderNumber, :member, :note) ON CONFLICT (ref_id, reason) WHERE ref_id IS NOT NULL DO NOTHING`,
            { replacements: { u: actor.userId, delta: -points, ref: order.id, orderNumber: order.orderNumber, member, note: `Order ${order.orderNumber}` }, transaction: t },
        );
        payment = await OrdersOrderPayment.findOne({ where: { orderId: order.id, transactionId: txnId }, transaction: t })
            || await OrdersOrderPayment.create({
                orderId: order.id, provider: 'points', transactionId: txnId, amount: order.totalAmount, currencyCode: order.currencyCode,
                status: 'captured', paidAt: new Date(), metadata: { points, pointsPerUsd: perUsd(), buyerMemberNumber: member },
            }, { transaction: t });
        await order.update({ paymentStatus: 'paid', status: order.status === 'pending' ? 'confirmed' : order.status }, { transaction: t });
    });
    await cache.del(cache.keys.order(order.id));
    securityAudit.payment('points_paid', 'allow', { storeId, resource: { type: 'order', id: order.id }, metadata: { points, transactionId: txnId } });
    await orderService.postCaptureEffects(storeId, order, payment, {
        amount: order.totalAmount, currencyCode: order.currencyCode, provider: 'points', transactionId: txnId, status: 'captured',
    });
    return { order: order.toJSON(), points, alreadyPaid: false };
}

// Refund a points payment: the refund row, the order state and the points going back into the buyer's
// wallet all commit together. Full or partial (partial returns points in proportion).
async function refundPointsPayment(order, captured, body = {}) {
    const capturedAmount = Number(captured.amount);
    const amount = body.amount != null ? Number(body.amount) : capturedAmount;
    if (!Number.isFinite(amount) || amount <= 0) throw new AppError('VALIDATION_ERROR', 'Refund amount must be a positive number', 400);
    if (amount > capturedAmount + 1e-9) throw new AppError('VALIDATION_ERROR', `Refund amount exceeds captured amount (${capturedAmount.toFixed(2)})`, 400);
    const customer = order.customerId ? await OrdersCustomer.findByPk(order.customerId, { attributes: ['userId'] }) : null;
    if (!customer || customer.userId == null) throw new AppError('CONFLICT', 'This order has no buyer wallet to refund into', 409);

    const points = pointsFor(amount);
    const full = amount >= capturedAmount - 1e-9;
    const refundRow = await sequelize.transaction(async (t) => {
        await lockUser(t, customer.userId);
        const row = await OrdersOrderPayment.create({
            orderId: order.id, provider: 'points', transactionId: `ptsrf_${order.id}_${Date.now()}`, amount: amount.toFixed(2), currencyCode: order.currencyCode,
            status: 'refunded', paidAt: new Date(), metadata: { refund: true, reason: body.reason || null, ofPaymentId: captured.id, points },
        }, { transaction: t });
        await sequelize.query(
            `INSERT INTO commerce.commerce_points_ledger (user_id, delta, reason, ref_id, order_number, member_number, note)
             VALUES (:u, :delta, 'refund', :ref, :orderNumber, :member, :note)`,
            { replacements: { u: customer.userId, delta: points, ref: row.id, orderNumber: order.orderNumber, member: await memberNumberOf(customer.userId, t), note: `Refund for order ${order.orderNumber}${body.reason ? `: ${body.reason}` : ''}` }, transaction: t },
        );
        await order.update({ paymentStatus: full ? 'refunded' : 'partially_paid', status: full ? 'refunded' : order.status }, { transaction: t });
        await ledgerOutbox.enqueueRefund({
            storeId: order.storeId, refundId: row.id, orderId: order.id, orderNumber: order.orderNumber,
            amount: amount.toFixed(2), currencyCode: order.currencyCode, provider: 'points', transactionId: row.transactionId, reason: body.reason,
        }, t);
        return row;
    });
    await cache.del(cache.keys.order(order.id));
    securityAudit.payment('points_refunded', 'allow', { storeId: order.storeId, resource: { type: 'order', id: order.id }, metadata: { points, full } });
    return refundRow.toJSON();
}

module.exports = { pointsFor, payOrder, refundPointsPayment };
