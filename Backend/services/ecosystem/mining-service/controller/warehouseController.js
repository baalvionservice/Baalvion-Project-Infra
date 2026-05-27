'use strict';
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listWarehouses = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const where = {};
        if (req.query.country) where.country = req.query.country;
        if (req.query.status) where.status = req.query.status;
        const { count, rows } = await db.Warehouse.findAndCountAll({ where, limit, offset, order: [['created_at', 'DESC']] });
        return sendPaginated(req, res, { items: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
    } catch (err) { return next(err); }
};

const createWarehouse = async (req, res, next) => {
    try {
        if (!req.body.name) return next(new AppError('VALIDATION_ERROR', 'name is required', 422));
        const warehouse = await db.Warehouse.create({ ...req.body, org_id: req.user.orgId });
        return sendSuccess(req, res, warehouse, 201);
    } catch (err) { return next(err); }
};

const getWarehouse = async (req, res, next) => {
    try {
        const warehouse = await db.Warehouse.findByPk(req.params.id);
        if (!warehouse) return next(new AppError('NOT_FOUND', 'Warehouse not found', 404));
        return sendSuccess(req, res, warehouse);
    } catch (err) { return next(err); }
};

const updateWarehouse = async (req, res, next) => {
    try {
        const warehouse = await db.Warehouse.findByPk(req.params.id);
        if (!warehouse) return next(new AppError('NOT_FOUND', 'Warehouse not found', 404));
        await warehouse.update(req.body);
        return sendSuccess(req, res, warehouse);
    } catch (err) { return next(err); }
};

const deleteWarehouse = async (req, res, next) => {
    try {
        if (!(req.auth.roles || []).some((r) => ['admin', 'owner', 'super_admin'].includes(r))) return next(new AppError('FORBIDDEN', 'Admin only', 403));
        const warehouse = await db.Warehouse.findByPk(req.params.id);
        if (!warehouse) return next(new AppError('NOT_FOUND', 'Warehouse not found', 404));
        await warehouse.destroy();
        return sendSuccess(req, res, { id: req.params.id, deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listWarehouses, createWarehouse, getWarehouse, updateWarehouse, deleteWarehouse };
