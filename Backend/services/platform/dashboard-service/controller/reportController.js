'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

async function _createAuditLog(req, action, entity_type, entity_id) {
    try {
        await db.AuditLog.create({
            org_id: req.user.orgId,
            action,
            entity_type,
            entity_id,
            user_id: req.user.id,
            role: req.user.role,
            resource: req.originalUrl,
            ip_address: req.ip,
            status: 'Success',
            severity: 'Info',
        });
    } catch (_) { /* non-blocking */ }
}

async function _generateReportData(report, orgId) {
    const type = report.report_type;
    let data = {};

    if (type === 'financial' || type === 'profit') {
        const { fn, col, literal } = require('sequelize');
        const rev = await db.FinancialEntry.findOne({
            attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
            where: { org_id: orgId, type: 'Revenue' },
            raw: true,
        });
        const exp = await db.FinancialEntry.findOne({
            attributes: [[fn('COALESCE', fn('SUM', col('amount')), 0), 'total']],
            where: { org_id: orgId, type: 'Expense' },
            raw: true,
        });
        const total_revenue = parseFloat(rev.total) || 0;
        const total_expenses = parseFloat(exp.total) || 0;
        data = { total_revenue, total_expenses, total_profit: total_revenue - total_expenses };
    } else if (type === 'employees') {
        const count = await db.Employee.count({ where: { org_id: orgId } });
        data = { total_employees: count };
    } else if (type === 'shareholders') {
        const shareholders = await db.Shareholder.findAll({ where: { org_id: orgId }, raw: true });
        data = { shareholders };
    } else {
        data = { message: `Report type '${type}' generated`, generated_at: new Date().toISOString() };
    }

    return data;
}

exports.generateReport = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { report_type = 'general', ...options } = req.body;

        const report = await db.GeneratedReport.create({
            org_id: orgId,
            report_type,
            status: 'generating',
            options,
        });

        await _createAuditLog(req, 'GENERATE_REPORT', 'generated_report', String(report.id));

        // Async processing with setImmediate → simulate ~2s delay
        setImmediate(async () => {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            try {
                const data = await _generateReportData(report, orgId);
                await report.update({ status: 'ready', data });
            } catch (err) {
                await report.update({ status: 'failed', data: { error: err.message } }).catch(() => {});
            }
        });

        return sendSuccess(req, res, { report_id: report.id, status: 'generating', message: 'Report generation started' }, 202);
    } catch (err) { return next(err); }
};

exports.downloadReport = async (req, res, next) => {
    try {
        const { report_id } = req.params;
        const report = await db.GeneratedReport.findOne({ where: { id: report_id, org_id: req.user.orgId } });
        if (!report) return next(new AppError('NOT_FOUND', 'Report not found', 404));
        return sendSuccess(req, res, {
            id: report.id,
            report_type: report.report_type,
            status: report.status,
            data: report.data,
            options: report.options,
            created_at: report.created_at,
            updated_at: report.updated_at,
        });
    } catch (err) { return next(err); }
};
