'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess } = require('../utils/response');

async function _audit(req, action, entity_type, entity_id) {
    try {
        await db.AuditLog.create({
            org_id: req.user.orgId, action, entity_type, entity_id,
            user_id: req.user.id, role: req.user.role, resource: req.originalUrl,
            ip_address: req.ip, status: 'Success', severity: 'Info',
        });
    } catch (_) { /* non-blocking */ }
}

const dateOnly = (v) => (v == null ? null : String(v).slice(0, 10));

exports.get = async (req, res, next) => {
    try {
        const rows = await db.FinanceReport.findAll({ where: { org_id: req.user.orgId }, order: [['generated_at', 'DESC']], raw: true });
        return sendSuccess(req, res, rows.map((r) => ({
            id: r.report_key, name: r.name, type: r.type, period: r.period,
            generated: dateOnly(r.generated_at), size: r.size_label,
        })));
    } catch (err) { return next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const { name, type, period } = req.body;
        if (!name || !type) return next(new AppError('VALIDATION_ERROR', 'name and type are required', 400));
        const row = await db.FinanceReport.create({
            org_id: req.user.orgId,
            report_key: `rep_${Date.now().toString(36)}`,
            name, type, period: period || null,
            generated_at: new Date(),
            size_label: '—',
        });
        await _audit(req, 'GENERATE_FINANCE_REPORT', 'finance_report', row.report_key);
        return sendSuccess(req, res, {
            id: row.report_key, name: row.name, type: row.type, period: row.period,
            generated: dateOnly(row.generated_at), size: row.size_label,
        }, 201);
    } catch (err) { return next(err); }
};
