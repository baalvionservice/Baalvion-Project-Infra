'use strict';
/** Logistics Core Foundation (Phase 2) — fleet vehicles. Same shape as containerController.js. */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { createVehicleSchema, updateVehicleSchema } = require('../validators/vehicle.schema');
const { auditLogistics } = require('../utils/logisticsAudit');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

async function fetchVehicleOwned(id, req, next) {
    const row = await db.Vehicle.findByPk(id);
    if (!row) { next(new AppError('NOT_FOUND', 'Vehicle not found', 404)); return null; }
    if (isAdmin(req)) return row;
    const tenantId = callerTenantId(req);
    if (tenantId && row.tenant_id && row.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Vehicle not found', 404)); return null;
    }
    return row;
}

function toApi(r) {
    return {
        id: r.id, vehicleNumber: r.vehicle_number, vehicleType: r.vehicle_type,
        capacityKg: r.capacity_kg != null ? Number(r.capacity_kg) : null,
        capacityVolumeCbm: r.capacity_volume_cbm != null ? Number(r.capacity_volume_cbm) : null,
        status: r.status, currentLocation: r.current_location, carrierId: r.carrier_id,
        make: r.make, model: r.model, year: r.year, gpsDeviceId: r.gps_device_id,
        metadata: r.metadata, createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

function fromApi(v) {
    return {
        vehicle_number: v.vehicleNumber,
        vehicle_type: v.vehicleType,
        capacity_kg: v.capacityKg,
        capacity_volume_cbm: v.capacityVolumeCbm,
        status: v.status,
        current_location: v.currentLocation,
        carrier_id: v.carrierId,
        make: v.make,
        model: v.model,
        year: v.year,
        gps_device_id: v.gpsDeviceId,
        metadata: v.metadata,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'vehicle_number', 'status'] });
        const where = {};
        if (req.query.vehicleType) where.vehicle_type = req.query.vehicleType;
        if (req.query.status) where.status = req.query.status;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.Vehicle.findAndCountAll({ where, limit, offset, order });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await fetchVehicleOwned(req.params.id, req, next);
        if (!row) return undefined;
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const parsed = createVehicleSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const tenantId = callerTenantId(req);
        const row = await db.Vehicle.create({
            ...fromApi(parsed.data),
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        await auditLogistics(req, 'vehicle.created', 'vehicle', row.id, { vehicleNumber: row.vehicle_number });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const row = await fetchVehicleOwned(req.params.id, req, next);
        if (!row) return undefined;
        const parsed = updateVehicleSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const updates = fromApi(parsed.data);
        Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
        await row.update(updates);
        await auditLogistics(req, 'vehicle.updated', 'vehicle', row.id, { fields: Object.keys(updates) });
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
    try {
        const row = await fetchVehicleOwned(req.params.id, req, next);
        if (!row) return undefined;
        await row.destroy();
        await auditLogistics(req, 'vehicle.deleted', 'vehicle', row.id);
        return sendSuccess(req, res, { id: row.id, deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, update, remove };
