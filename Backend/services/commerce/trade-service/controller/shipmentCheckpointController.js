'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — physical checkpoint CRUD +
 * arrive/depart lifecycle actions (delegates the dwell-time math to
 * service/tracking-platform/checkpointEngine.js).
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { auditLogistics } = require('../utils/logisticsAudit');
const checkpointEngine = require('../service/tracking-platform/checkpointEngine');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}
function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

function toApi(r) {
    return {
        id: r.id, shipmentId: r.shipment_id, checkpointType: r.checkpoint_type, name: r.name,
        sequence: r.sequence, arrivedAt: r.arrived_at, departedAt: r.departed_at,
        delayMinutes: r.delay_minutes, waitingMinutes: r.waiting_minutes,
        inspectionStatus: r.inspection_status, approved: r.approved,
        latitude: r.latitude != null ? Number(r.latitude) : null,
        longitude: r.longitude != null ? Number(r.longitude) : null,
        metadata: r.metadata, createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset } = parseListQuery(req.query, { allowedSort: ['sequence', 'created_at'] });
        const where = {};
        if (req.query.shipmentId) where.shipment_id = req.query.shipmentId;
        if (req.query.checkpointType) where.checkpoint_type = req.query.checkpointType;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.ShipmentCheckpoint.findAndCountAll({ where, limit, offset, order: [['sequence', 'ASC']] });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await db.ShipmentCheckpoint.findByPk(req.params.id);
        if (!row) return next(new AppError('NOT_FOUND', 'Checkpoint not found', 404));
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const arrive = async (req, res, next) => {
    try {
        const { shipmentId, checkpointType, name, sequence, latitude, longitude } = req.body || {};
        if (!shipmentId) return next(new AppError('BAD_REQUEST', 'shipmentId is required', 400));
        if (!checkpointType) return next(new AppError('BAD_REQUEST', 'checkpointType is required', 400));
        const row = await checkpointEngine.arriveCheckpoint({
            shipmentId, checkpointType, name, sequence, latitude, longitude,
            tenantId: callerTenantId(req), createdBy: req.auth && req.auth.userId,
        });
        await auditLogistics(req, 'shipment_checkpoint.arrived', 'shipment_checkpoint', row.id, { shipmentId, checkpointType });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const depart = async (req, res, next) => {
    try {
        const { inspectionStatus, approved } = req.body || {};
        const row = await checkpointEngine.departCheckpoint(req.params.id, { inspectionStatus, approved });
        await checkpointEngine.computeDelayAgainstRoute(row.id);
        await auditLogistics(req, 'shipment_checkpoint.departed', 'shipment_checkpoint', row.id);
        return sendSuccess(req, res, toApi(row));
    } catch (err) {
        if (err.message === 'checkpoint not found') return next(new AppError('NOT_FOUND', err.message, 404));
        return next(err);
    }
};

module.exports = { list, get, arrive, depart };
