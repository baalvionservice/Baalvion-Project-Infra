'use strict';
const db = require('../models');
const { AppError } = require('../utils/errors');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { Op } = require('sequelize');

const paginate = (page = 1, limit = 20) => ({
    limit: Math.min(Number(limit), 100),
    offset: (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100),
});

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

exports.listAlerts = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { page, limit, severity, status, business_id } = req.query;
        const where = { org_id: orgId };
        if (severity) where.severity = severity;
        if (status) where.status = status;
        if (business_id) where.business_id = Number(business_id);

        const { limit: lim, offset } = paginate(page, limit);
        const { rows, count } = await db.OperationsAlert.findAndCountAll({
            where,
            include: [{ model: db.Domain, as: 'business', attributes: ['id', 'name'], required: false }],
            limit: lim,
            offset,
            order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { data: rows, total: count, page: Math.max(Number(page) || 1, 1), limit: lim, totalPages: Math.ceil(count / lim) });
    } catch (err) { return next(err); }
};

exports.createAlert = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { title, message, severity, status, business_id } = req.body;
        if (!title) return next(new AppError('VALIDATION_ERROR', 'title is required', 400));
        const alert = await db.OperationsAlert.create({ org_id: orgId, title, message, severity, status, business_id });
        await _createAuditLog(req, 'CREATE_ALERT', 'operations_alert', String(alert.id));
        return sendSuccess(req, res, alert, 201);
    } catch (err) { return next(err); }
};

exports.updateAlert = async (req, res, next) => {
    try {
        const alert = await db.OperationsAlert.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!alert) return next(new AppError('NOT_FOUND', 'Alert not found', 404));
        const { title, message, severity, status, business_id } = req.body;
        await alert.update({ title, message, severity, status, business_id });
        await _createAuditLog(req, 'UPDATE_ALERT', 'operations_alert', String(alert.id));
        return sendSuccess(req, res, alert);
    } catch (err) { return next(err); }
};

exports.listAlertRules = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { page, limit } = req.query;
        const { limit: lim, offset } = paginate(page, limit);
        const { rows, count } = await db.AlertRule.findAndCountAll({
            where: { org_id: orgId },
            limit: lim,
            offset,
            order: [['created_at', 'DESC']],
        });
        return sendPaginated(req, res, { data: rows, total: count, page: Math.max(Number(page) || 1, 1), limit: lim, totalPages: Math.ceil(count / lim) });
    } catch (err) { return next(err); }
};

exports.createAlertRule = async (req, res, next) => {
    try {
        const orgId = req.user.orgId;
        const { name, condition, threshold, metric, is_active, notification_channels } = req.body;
        if (!name) return next(new AppError('VALIDATION_ERROR', 'name is required', 400));
        const rule = await db.AlertRule.create({ org_id: orgId, name, condition, threshold, metric, is_active, notification_channels });
        await _createAuditLog(req, 'CREATE_ALERT_RULE', 'alert_rule', String(rule.id));
        return sendSuccess(req, res, rule, 201);
    } catch (err) { return next(err); }
};

exports.updateAlertRule = async (req, res, next) => {
    try {
        const rule = await db.AlertRule.findOne({ where: { id: req.params.id, org_id: req.user.orgId } });
        if (!rule) return next(new AppError('NOT_FOUND', 'Alert rule not found', 404));
        const { name, condition, threshold, metric, is_active, notification_channels } = req.body;
        await rule.update({ name, condition, threshold, metric, is_active, notification_channels });
        await _createAuditLog(req, 'UPDATE_ALERT_RULE', 'alert_rule', String(rule.id));
        return sendSuccess(req, res, rule);
    } catch (err) { return next(err); }
};
