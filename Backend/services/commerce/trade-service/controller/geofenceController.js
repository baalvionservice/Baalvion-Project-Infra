'use strict';
/**
 * Shipment Tracking & Global Visibility Platform — geofence CRUD +
 * geofence-event history. Containment/entry-exit detection itself lives in
 * service/tracking-platform/geofenceEngine.js, hooked off every tracking_event write.
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { auditLogistics } = require('../utils/logisticsAudit');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}
function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

function toApi(r) {
    return {
        id: r.id, name: r.name, fenceType: r.fence_type, shape: r.shape, active: r.active,
        metadata: r.metadata, createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset } = parseListQuery(req.query, { allowedSort: ['created_at', 'name'] });
        const where = {};
        if (req.query.fenceType) where.fence_type = req.query.fenceType;
        if (req.query.active != null) where.active = req.query.active === 'true';
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.Geofence.findAndCountAll({ where, limit, offset, order: [['created_at', 'DESC']] });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await db.Geofence.findByPk(req.params.id);
        if (!row) return next(new AppError('NOT_FOUND', 'Geofence not found', 404));
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const { name, fenceType, shape, active, metadata } = req.body || {};
        if (!name) return next(new AppError('BAD_REQUEST', 'name is required', 400));
        if (!fenceType) return next(new AppError('BAD_REQUEST', 'fenceType is required', 400));
        const tenantId = callerTenantId(req);
        const row = await db.Geofence.create({
            name, fence_type: fenceType, shape: shape || {}, active: active !== false, metadata: metadata || {},
            created_by: req.auth && req.auth.userId,
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        await auditLogistics(req, 'geofence.created', 'geofence', row.id, { name, fenceType });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const row = await db.Geofence.findByPk(req.params.id);
        if (!row) return next(new AppError('NOT_FOUND', 'Geofence not found', 404));
        const { name, fenceType, shape, active, metadata } = req.body || {};
        await row.update({
            ...(name != null ? { name } : {}),
            ...(fenceType != null ? { fence_type: fenceType } : {}),
            ...(shape != null ? { shape } : {}),
            ...(active != null ? { active } : {}),
            ...(metadata != null ? { metadata } : {}),
            updated_by: req.auth && req.auth.userId,
        });
        await auditLogistics(req, 'geofence.updated', 'geofence', row.id);
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
    try {
        const row = await db.Geofence.findByPk(req.params.id);
        if (!row) return next(new AppError('NOT_FOUND', 'Geofence not found', 404));
        await row.update({ active: false, deleted_by: req.auth && req.auth.userId });
        await row.destroy();
        await auditLogistics(req, 'geofence.deleted', 'geofence', row.id);
        return sendSuccess(req, res, { id: row.id, deleted: true });
    } catch (err) { return next(err); }
};

const listEvents = async (req, res, next) => {
    try {
        const { limit, offset } = parseListQuery(req.query, { allowedSort: ['occurred_at'] });
        const where = {};
        if (req.params.id) where.geofence_id = req.params.id;
        if (req.query.shipmentId) where.shipment_id = req.query.shipmentId;
        const { count, rows } = await db.GeofenceEvent.findAndCountAll({ where, limit, offset, order: [['occurred_at', 'DESC']] });
        return sendPaginated(req, res, {
            items: rows.map((r) => ({
                id: r.id, geofenceId: r.geofence_id, shipmentId: r.shipment_id, eventType: r.event_type,
                latitude: r.latitude != null ? Number(r.latitude) : null,
                longitude: r.longitude != null ? Number(r.longitude) : null,
                occurredAt: r.occurred_at, metadata: r.metadata,
            })),
            total: count, page: Number(req.query.page) || 1, limit,
        });
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, update, remove, listEvents };
