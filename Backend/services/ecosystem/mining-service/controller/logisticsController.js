'use strict';
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listShipments = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const where = { org_id: req.user.orgId };
        if (req.query.status) where.status = req.query.status;
        if (req.query.order_id) where.order_id = req.query.order_id;
        const { count, rows } = await db.LogisticsShipment.findAndCountAll({ where, limit, offset, order: [['created_at', 'DESC']] });
        return sendPaginated(req, res, { items: rows, pagination: { total: count, page, limit, totalPages: Math.ceil(count / limit) } });
    } catch (err) { return next(err); }
};

const getShipment = async (req, res, next) => {
    try {
        const shipment = await db.LogisticsShipment.findByPk(req.params.id);
        if (!shipment) return next(new AppError('NOT_FOUND', 'Shipment not found', 404));
        return sendSuccess(req, res, shipment);
    } catch (err) { return next(err); }
};

const createShipment = async (req, res, next) => {
    try {
        if (!req.body.order_id) return next(new AppError('VALIDATION_ERROR', 'order_id is required', 422));
        const order = await db.Order.findByPk(req.body.order_id);
        if (!order) return next(new AppError('NOT_FOUND', 'Order not found', 404));
        const shipment = await db.LogisticsShipment.create({ ...req.body, org_id: req.user.orgId });
        return sendSuccess(req, res, shipment, 201);
    } catch (err) { return next(err); }
};

const updateShipment = async (req, res, next) => {
    try {
        const shipment = await db.LogisticsShipment.findByPk(req.params.id);
        if (!shipment) return next(new AppError('NOT_FOUND', 'Shipment not found', 404));
        await shipment.update(req.body);
        return sendSuccess(req, res, shipment);
    } catch (err) { return next(err); }
};

const addCheckpoint = async (req, res, next) => {
    try {
        const shipment = await db.LogisticsShipment.findByPk(req.params.id);
        if (!shipment) return next(new AppError('NOT_FOUND', 'Shipment not found', 404));
        const { event, location, timestamp, notes } = req.body;
        if (!event) return next(new AppError('VALIDATION_ERROR', 'event is required', 422));
        const checkpoint = { event, location, timestamp: timestamp || new Date().toISOString(), notes };
        const events = Array.isArray(shipment.tracking_events) ? shipment.tracking_events : [];
        await shipment.update({ tracking_events: [...events, checkpoint] });
        return sendSuccess(req, res, shipment);
    } catch (err) { return next(err); }
};

module.exports = { listShipments, getShipment, createShipment, updateShipment, addCheckpoint };
