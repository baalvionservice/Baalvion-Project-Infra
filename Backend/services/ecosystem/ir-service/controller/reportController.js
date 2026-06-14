'use strict';
const reportService = require('../service/reportService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createReportSchema, updateReportSchema, paginationSchema } = require('../validators/schemas');

// Single-tenant IR service: derive orgId exclusively from the verified token;
// unauthenticated public reads fall back to the configured default — never trust
// a client-supplied org_id.
const DEFAULT_ORG_ID = process.env.IR_DEFAULT_ORG_ID || '11111111-1111-1111-1111-111111111111';

const listReports = async (req, res, next) => {
    try {
        const parsed = paginationSchema.safeParse(req.query);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const isAuth = !!req.user;
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        const data = await reportService.listReports(orgId, isAuth, parsed.data);
        return sendPaginated(req, res, data);
    } catch (err) { return next(err); }
};

const createReport = async (req, res, next) => {
    try {
        const parsed = createReportSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await reportService.createReport(req.user.orgId, req.user.id, parsed.data);
        return sendSuccess(req, res, data, 201);
    } catch (err) { return next(err); }
};

const getReport = async (req, res, next) => {
    try {
        const orgId = req.user?.orgId || DEFAULT_ORG_ID;
        const data = await reportService.getReport(req.params.id, orgId);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const updateReport = async (req, res, next) => {
    try {
        const parsed = updateReportSchema.safeParse(req.body);
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', 'Validation failed', 400, parsed.error.flatten()));
        const data = await reportService.updateReport(req.params.id, req.user.orgId, parsed.data);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

const deleteReport = async (req, res, next) => {
    try {
        await reportService.deleteReport(req.params.id, req.user.orgId);
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

const publishReport = async (req, res, next) => {
    try {
        const data = await reportService.publishReport(req.params.id, req.user.orgId);
        return sendSuccess(req, res, data);
    } catch (err) { return next(err); }
};

module.exports = { listReports, createReport, getReport, updateReport, deleteReport, publishReport };
