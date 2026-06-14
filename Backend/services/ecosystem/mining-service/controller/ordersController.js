'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listOrders = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const where = {};
        // Canonical RBAC: domain roles (buyer/seller) lift to roles[] membership;
        // admin scope = hierarchical admin/owner/super_admin. First-match precedence
        // preserves the legacy if/else-if order if a user holds both buyer and seller.
        const roles = req.auth.roles || [];
        const isAdmin = roles.some((r) => ['admin', 'owner', 'super_admin'].includes(r));
        if (roles.includes('buyer')) {
            where.buyer_id = req.user.id;
        } else if (roles.includes('seller')) {
            where.seller_id = req.user.id;
        } else if (!isAdmin) {
            where[Op.or] = [{ buyer_id: req.user.id }, { seller_id: req.user.id }];
        }
        if (req.query.status) where.status = req.query.status;
        if (req.query.payment_status) where.payment_status = req.query.payment_status;
        const { count, rows } = await db.Order.findAndCountAll({ where, limit, offset, order: [['created_at', 'DESC']] });
        return sendPaginated(req, res, { items: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
    } catch (err) { return next(err); }
};

const getOrder = async (req, res, next) => {
    try {
        const order = await db.Order.findByPk(req.params.id, {
            include: [{ model: db.LogisticsShipment, as: 'shipment' }],
        });
        if (!order) return next(new AppError('NOT_FOUND', 'Order not found', 404));
        // IDOR: scope to caller — buyer, seller, or admin
        const roles = req.auth.roles || [];
        const isAdmin = roles.some((r) => ['admin', 'owner', 'super_admin'].includes(r));
        const callerId = req.user.id;
        if (!isAdmin && order.buyer_id !== callerId && order.seller_id !== callerId) {
            return next(new AppError('FORBIDDEN', 'Not authorized to view this order', 403));
        }
        return sendSuccess(req, res, order);
    } catch (err) { return next(err); }
};

const confirmOrder = async (req, res, next) => {
    try {
        const order = await db.Order.findByPk(req.params.id);
        if (!order) return next(new AppError('NOT_FOUND', 'Order not found', 404));
        // IDOR: only the seller (or admin) may confirm an order
        const roles = req.auth.roles || [];
        const isAdmin = roles.some((r) => ['admin', 'owner', 'super_admin'].includes(r));
        if (!isAdmin && order.seller_id !== req.user.id) {
            return next(new AppError('FORBIDDEN', 'Not authorized to confirm this order', 403));
        }
        await order.update({ status: 'confirmed' });
        return sendSuccess(req, res, order);
    } catch (err) { return next(err); }
};

const cancelOrder = async (req, res, next) => {
    try {
        const order = await db.Order.findByPk(req.params.id);
        if (!order) return next(new AppError('NOT_FOUND', 'Order not found', 404));
        if (order.status !== 'pending') return next(new AppError('CONFLICT', 'Only pending orders can be cancelled', 409));
        // IDOR: only the buyer or seller (or admin) may cancel their own order
        const roles = req.auth.roles || [];
        const isAdmin = roles.some((r) => ['admin', 'owner', 'super_admin'].includes(r));
        if (!isAdmin && order.buyer_id !== req.user.id && order.seller_id !== req.user.id) {
            return next(new AppError('FORBIDDEN', 'Not authorized to cancel this order', 403));
        }
        await order.update({ status: 'cancelled' });
        return sendSuccess(req, res, order);
    } catch (err) { return next(err); }
};

const updatePayment = async (req, res, next) => {
    try {
        const order = await db.Order.findByPk(req.params.id);
        if (!order) return next(new AppError('NOT_FOUND', 'Order not found', 404));
        // IDOR: only the buyer (who pays) or admin may update payment status
        const roles = req.auth.roles || [];
        const isAdmin = roles.some((r) => ['admin', 'owner', 'super_admin'].includes(r));
        if (!isAdmin && order.buyer_id !== req.user.id) {
            return next(new AppError('FORBIDDEN', 'Not authorized to update payment on this order', 403));
        }
        const { payment_status } = req.body;
        if (!payment_status) return next(new AppError('VALIDATION_ERROR', 'payment_status is required', 422));
        await order.update({ payment_status });
        return sendSuccess(req, res, order);
    } catch (err) { return next(err); }
};

const getOrderAnalytics = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const [summary] = await db.sequelize.query(
            `SELECT status, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS total
             FROM mining.orders
             WHERE org_id = :orgId
             GROUP BY status`,
            { replacements: { orgId }, type: db.sequelize.QueryTypes.SELECT }
        );
        const [monthly] = await db.sequelize.query(
            `SELECT DATE_TRUNC('month', created_at) AS month, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS total
             FROM mining.orders
             WHERE org_id = :orgId AND created_at >= NOW() - INTERVAL '12 months'
             GROUP BY month ORDER BY month`,
            { replacements: { orgId }, type: db.sequelize.QueryTypes.SELECT }
        );
        return sendSuccess(req, res, { by_status: summary || [], monthly: monthly || [] });
    } catch (err) { return next(err); }
};

module.exports = { listOrders, getOrder, confirmOrder, cancelOrder, updatePayment, getOrderAnalytics };
