'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — detected delay-cause feed
 * (delegates detection to service/tracking-platform/delayDetectionEngine.js).
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { auditLogistics } = require('../utils/logisticsAudit');
const delayEngine = require('../service/tracking-platform/delayDetectionEngine');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}
function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

function toApi(r) {
    return {
        id: r.id, shipmentId: r.shipment_id, delayType: r.delay_type, detectedAt: r.detected_at,
        estimatedDelayMinutes: r.estimated_delay_minutes, resolved: r.resolved, resolvedAt: r.resolved_at,
        metadata: r.metadata, createdAt: r.created_at,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset } = parseListQuery(req.query, { allowedSort: ['detected_at'] });
        const where = {};
        if (req.query.shipmentId) where.shipment_id = req.query.shipmentId;
        if (req.query.delayType) where.delay_type = req.query.delayType;
        if (req.query.resolved != null) where.resolved = req.query.resolved === 'true';
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.DelayEvent.findAndCountAll({ where, limit, offset, order: [['detected_at', 'DESC']] });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const resolve = async (req, res, next) => {
    try {
        const row = await db.DelayEvent.findByPk(req.params.id);
        if (!row) return next(new AppError('NOT_FOUND', 'Delay event not found', 404));
        await row.update({ resolved: true, resolved_at: new Date() });
        await auditLogistics(req, 'delay_event.resolved', 'delay_event', row.id);
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

// POST /delay_events/sweep — run the delay-detection sweep now (also runs on a
// scheduled queue job — see queue/workers.js `delay_sweep`).
const sweep = async (req, res, next) => {
    try {
        const result = await delayEngine.sweepDelays();
        return sendSuccess(req, res, result);
    } catch (err) { return next(err); }
};

module.exports = { list, resolve, sweep };
