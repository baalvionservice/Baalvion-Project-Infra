'use strict';
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listDisputes = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const where = { org_id: req.user.orgId };
        if (req.query.status) where.status = req.query.status;
        const { count, rows } = await db.Dispute.findAndCountAll({ where, limit, offset, order: [['created_at', 'DESC']] });
        return sendPaginated(req, res, { items: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
    } catch (err) { return next(err); }
};

const createDispute = async (req, res, next) => {
    try {
        if (!req.body.order_id) return next(new AppError('VALIDATION_ERROR', 'order_id is required', 422));
        const order = await db.Order.findByPk(req.body.order_id);
        if (!order) return next(new AppError('NOT_FOUND', 'Order not found', 404));
        const dispute = await db.Dispute.create({
            ...req.body,
            complainant_id: req.user.id,
            org_id: req.user.orgId,
        });
        return sendSuccess(req, res, dispute, 201);
    } catch (err) { return next(err); }
};

const getDispute = async (req, res, next) => {
    try {
        const dispute = await db.Dispute.findByPk(req.params.id);
        if (!dispute) return next(new AppError('NOT_FOUND', 'Dispute not found', 404));
        return sendSuccess(req, res, dispute);
    } catch (err) { return next(err); }
};

const updateDispute = async (req, res, next) => {
    try {
        const dispute = await db.Dispute.findByPk(req.params.id);
        if (!dispute) return next(new AppError('NOT_FOUND', 'Dispute not found', 404));
        const updateData = { ...req.body };
        if (req.body.resolution !== undefined || req.body.admin_notes !== undefined) {
            if (req.user.role !== 'admin') return next(new AppError('FORBIDDEN', 'Only admins can set resolution', 403));
        }
        await dispute.update(updateData);
        return sendSuccess(req, res, dispute);
    } catch (err) { return next(err); }
};

module.exports = { listDisputes, createDispute, getDispute, updateDispute };
