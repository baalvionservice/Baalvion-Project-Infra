'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — alert feed +
 * acknowledge/resolve actions. Alerts are only ever CREATED by
 * service/tracking-platform/alertEngine.js (from geofence/IoT/delay/ETA
 * engines); this controller is read + ack/resolve only.
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { auditLogistics } = require('../utils/logisticsAudit');
const alertEngine = require('../service/tracking-platform/alertEngine');
const notificationDispatcher = require('../service/tracking-platform/notificationDispatcher');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}
function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

function toApi(r) {
    return {
        id: r.id, shipmentId: r.shipment_id, alertType: r.alert_type, severity: r.severity,
        message: r.message, status: r.status, triggeredAt: r.triggered_at,
        acknowledgedBy: r.acknowledged_by, acknowledgedAt: r.acknowledged_at, resolvedAt: r.resolved_at,
        metadata: r.metadata, createdAt: r.created_at,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset } = parseListQuery(req.query, { allowedSort: ['triggered_at', 'severity'] });
        const where = {};
        if (req.query.shipmentId) where.shipment_id = req.query.shipmentId;
        if (req.query.status) where.status = req.query.status;
        if (req.query.severity) where.severity = req.query.severity;
        if (req.query.alertType) where.alert_type = req.query.alertType;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.ShipmentAlert.findAndCountAll({ where, limit, offset, order: [['triggered_at', 'DESC']] });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await db.ShipmentAlert.findByPk(req.params.id);
        if (!row) return next(new AppError('NOT_FOUND', 'Alert not found', 404));
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const acknowledge = async (req, res, next) => {
    try {
        const row = await alertEngine.acknowledgeAlert(req.params.id, req.auth && req.auth.userId);
        await auditLogistics(req, 'shipment_alert.acknowledged', 'shipment_alert', row.id);
        return sendSuccess(req, res, toApi(row));
    } catch (err) {
        if (err.message === 'alert not found') return next(new AppError('NOT_FOUND', err.message, 404));
        return next(err);
    }
};

const resolve = async (req, res, next) => {
    try {
        const row = await alertEngine.resolveAlert(req.params.id);
        await auditLogistics(req, 'shipment_alert.resolved', 'shipment_alert', row.id);
        return sendSuccess(req, res, toApi(row));
    } catch (err) {
        if (err.message === 'alert not found') return next(new AppError('NOT_FOUND', err.message, 404));
        return next(err);
    }
};

const listNotifications = async (req, res, next) => {
    try {
        const { limit, offset } = parseListQuery(req.query, { allowedSort: ['created_at'] });
        const where = { alert_id: req.params.id };
        const { count, rows } = await db.ShipmentNotification.findAndCountAll({ where, limit, offset, order: [['created_at', 'DESC']] });
        return sendPaginated(req, res, {
            items: rows.map((r) => ({
                id: r.id, channel: r.channel, recipient: r.recipient, status: r.status,
                sentAt: r.sent_at, error: r.error, createdAt: r.created_at,
            })),
            total: count, page: Number(req.query.page) || 1, limit,
        });
    } catch (err) { return next(err); }
};

// Re-fire notifications for an existing alert (e.g. a channel was down and needs a retry).
const resend = async (req, res, next) => {
    try {
        const alert = await db.ShipmentAlert.findByPk(req.params.id);
        if (!alert) return next(new AppError('NOT_FOUND', 'Alert not found', 404));
        const rows = await notificationDispatcher.dispatchAlertNotifications(alert);
        return sendSuccess(req, res, { queued: rows.length });
    } catch (err) { return next(err); }
};

module.exports = { list, get, acknowledge, resolve, listNotifications, resend };
