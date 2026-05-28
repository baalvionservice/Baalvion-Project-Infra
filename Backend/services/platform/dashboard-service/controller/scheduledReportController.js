'use strict';
const scheduledReportService = require('../service/scheduledReportService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createScheduledReportSchema, updateScheduledReportSchema, paginationSchema } = require('../validators/schemas');

const listScheduledReports = async (req, res, next) => {
    try {
        const parsed = paginationSchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await scheduledReportService.listScheduledReports(req.user.orgId, parsed.data);
        return sendPaginated(req, res, data);
    } catch (err) { return next(err); }
};

const createScheduledReport = async (req, res, next) => {
    try {
        const parsed = createScheduledReportSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await scheduledReportService.createScheduledReport(req.user.orgId, req.user.id, parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

const updateScheduledReport = async (req, res, next) => {
    try {
        const parsed = updateScheduledReportSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await scheduledReportService.updateScheduledReport(req.params.id, req.user.orgId, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const deleteScheduledReport = async (req, res, next) => {
    try {
        await scheduledReportService.deleteScheduledReport(req.params.id, req.user.orgId);
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { listScheduledReports, createScheduledReport, updateScheduledReport, deleteScheduledReport };
