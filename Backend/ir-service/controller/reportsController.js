'use strict';
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated, sendError } = require('../utils/response');
const { AppError } = require('../utils/errors');

const listReports = async (req, res, next) => {
    try {
        const { org_id, report_type, status, fiscal_year, page = 1, limit = 20 } = req.query;
        const where = {};
        if (org_id) where.org_id = org_id;
        if (report_type) where.report_type = report_type;
        if (fiscal_year) where.fiscal_year = Number(fiscal_year);

        // Public access: only published; authenticated: filter by status if provided
        if (!req.user) {
            where.status = 'published';
        } else if (status) {
            where.status = status;
        }

        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.Report.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: Number(limit),
            offset,
        });

        return sendPaginated(req, res, {
            items: rows,
            pagination: {
                total: count,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(count / Number(limit)),
            },
        });
    } catch (err) { return next(err); }
};

const createReport = async (req, res, next) => {
    try {
        const report = await db.Report.create({ ...req.body, created_by: req.user.id });
        return sendSuccess(req, res, report, 201);
    } catch (err) { return next(err); }
};

const getReport = async (req, res, next) => {
    try {
        const report = await db.Report.findByPk(req.params.id);
        if (!report) return next(new AppError('NOT_FOUND', 'Report not found', 404));

        // Public: only published
        if (!req.user && report.status !== 'published') {
            return next(new AppError('NOT_FOUND', 'Report not found', 404));
        }

        // Increment downloads if query param download=true
        if (req.query.download === 'true') {
            await report.increment('downloads_count');
            await report.reload();
        }

        return sendSuccess(req, res, report);
    } catch (err) { return next(err); }
};

const updateReport = async (req, res, next) => {
    try {
        if (!['ir_manager', 'admin'].includes(req.user.role)) {
            return next(new AppError('FORBIDDEN', 'Insufficient permissions', 403));
        }
        const report = await db.Report.findByPk(req.params.id);
        if (!report) return next(new AppError('NOT_FOUND', 'Report not found', 404));
        await report.update(req.body);
        return sendSuccess(req, res, report);
    } catch (err) { return next(err); }
};

const deleteReport = async (req, res, next) => {
    try {
        const report = await db.Report.findByPk(req.params.id);
        if (!report) return next(new AppError('NOT_FOUND', 'Report not found', 404));

        // Admin can always delete; others only if draft
        if (req.user.role !== 'admin' && report.status !== 'draft') {
            return next(new AppError('FORBIDDEN', 'Only admins can delete non-draft reports', 403));
        }

        await report.destroy();
        return sendSuccess(req, res, { deleted: true });
    } catch (err) { return next(err); }
};

const publishReport = async (req, res, next) => {
    try {
        const report = await db.Report.findByPk(req.params.id);
        if (!report) return next(new AppError('NOT_FOUND', 'Report not found', 404));
        await report.update({ status: 'published', published_at: new Date() });
        return sendSuccess(req, res, report);
    } catch (err) { return next(err); }
};

const getReportsByYear = async (req, res, next) => {
    try {
        const { org_id } = req.query;
        const where = { status: 'published' };
        if (org_id) where.org_id = org_id;

        const reports = await db.Report.findAll({
            where,
            attributes: ['fiscal_year', 'report_type', [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
            group: ['fiscal_year', 'report_type'],
            order: [['fiscal_year', 'DESC']],
        });

        return sendSuccess(req, res, reports);
    } catch (err) { return next(err); }
};

module.exports = { listReports, createReport, getReport, updateReport, deleteReport, publishReport, getReportsByYear };
