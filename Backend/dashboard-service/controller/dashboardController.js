'use strict';
const dashboardService = require('../service/dashboardService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createDashboardSchema, updateDashboardSchema, paginationSchema } = require('../validators/schemas');

const listDashboards = async (req, res, next) => {
    try {
        const parsed = paginationSchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await dashboardService.listDashboards(req.user.orgId, req.user.id, parsed.data);
        return sendPaginated(req, res, data);
    } catch (err) { return next(err); }
};

const createDashboard = async (req, res, next) => {
    try {
        const parsed = createDashboardSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await dashboardService.createDashboard(req.user.orgId, req.user.id, parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

const getDashboard = async (req, res, next) => {
    try {
        const data = await dashboardService.getDashboard(req.params.id, req.user.orgId);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const updateDashboard = async (req, res, next) => {
    try {
        const parsed = updateDashboardSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await dashboardService.updateDashboard(req.params.id, req.user.orgId, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const deleteDashboard = async (req, res, next) => {
    try {
        await dashboardService.deleteDashboard(req.params.id, req.user.orgId);
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

const duplicateDashboard = async (req, res, next) => {
    try {
        const data = await dashboardService.duplicateDashboard(req.params.id, req.user.orgId, req.user.id);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

module.exports = { listDashboards, createDashboard, getDashboard, updateDashboard, deleteDashboard, duplicateDashboard };
