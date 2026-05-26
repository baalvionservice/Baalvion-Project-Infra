'use strict';
const alertService = require('../service/alertService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createAlertSchema, updateAlertSchema, paginationSchema } = require('../validators/schemas');

const listAlerts = async (req, res, next) => {
    try {
        const parsed = paginationSchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await alertService.listAlerts(req.user.id, parsed.data);
        return sendPaginated(req, res, data);
    } catch (err) { return next(err); }
};

const createAlert = async (req, res, next) => {
    try {
        const parsed = createAlertSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await alertService.createAlert(req.user.id, parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

const updateAlert = async (req, res, next) => {
    try {
        const parsed = updateAlertSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await alertService.updateAlert(req.params.id, req.user.id, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const deleteAlert = async (req, res, next) => {
    try {
        await alertService.deleteAlert(req.params.id, req.user.id);
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listAlerts, createAlert, updateAlert, deleteAlert };
