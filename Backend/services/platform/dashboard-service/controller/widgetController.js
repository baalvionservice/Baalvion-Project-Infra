'use strict';
const widgetService = require('../service/widgetService');
const { sendSuccess } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createWidgetSchema, updateWidgetSchema } = require('../validators/schemas');

const listWidgets = async (req, res, next) => {
    try {
        const data = await widgetService.listWidgets(req.params.id, req.user.orgId);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const createWidget = async (req, res, next) => {
    try {
        const parsed = createWidgetSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await widgetService.createWidget(req.params.id, req.user.orgId, parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

const getWidget = async (req, res, next) => {
    try {
        const data = await widgetService.getWidget(req.params.id, req.user.orgId);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const updateWidget = async (req, res, next) => {
    try {
        const parsed = updateWidgetSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await widgetService.updateWidget(req.params.id, req.user.orgId, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const deleteWidget = async (req, res, next) => {
    try {
        await widgetService.deleteWidget(req.params.id, req.user.orgId);
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listWidgets, createWidget, getWidget, updateWidget, deleteWidget };
