'use strict';
/** Logistics Core Foundation (Phase 2) — fleet drivers. Same shape as containerController.js. */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { createDriverSchema, updateDriverSchema } = require('../validators/driver.schema');
const { auditLogistics } = require('../utils/logisticsAudit');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

async function fetchDriverOwned(id, req, next) {
    const row = await db.Driver.findByPk(id);
    if (!row) { next(new AppError('NOT_FOUND', 'Driver not found', 404)); return null; }
    if (isAdmin(req)) return row;
    const tenantId = callerTenantId(req);
    if (tenantId && row.tenant_id && row.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Driver not found', 404)); return null;
    }
    return row;
}

function toApi(r) {
    return {
        id: r.id, fullName: r.full_name, licenseNumber: r.license_number,
        licenseExpiry: r.license_expiry, phone: r.phone, email: r.email,
        status: r.status, currentVehicleId: r.current_vehicle_id,
        rating: r.rating != null ? Number(r.rating) : null,
        metadata: r.metadata, createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

function fromApi(v) {
    return {
        full_name: v.fullName,
        license_number: v.licenseNumber,
        license_expiry: v.licenseExpiry,
        phone: v.phone,
        email: v.email,
        status: v.status,
        current_vehicle_id: v.currentVehicleId,
        rating: v.rating,
        metadata: v.metadata,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'full_name', 'status'] });
        const where = {};
        if (req.query.status) where.status = req.query.status;
        if (req.query.currentVehicleId) where.current_vehicle_id = req.query.currentVehicleId;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.Driver.findAndCountAll({ where, limit, offset, order });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await fetchDriverOwned(req.params.id, req, next);
        if (!row) return undefined;
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const parsed = createDriverSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const tenantId = callerTenantId(req);
        const row = await db.Driver.create({
            ...fromApi(parsed.data),
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        await auditLogistics(req, 'driver.created', 'driver', row.id, { fullName: row.full_name });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const row = await fetchDriverOwned(req.params.id, req, next);
        if (!row) return undefined;
        const parsed = updateDriverSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const updates = fromApi(parsed.data);
        Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
        await row.update(updates);
        await auditLogistics(req, 'driver.updated', 'driver', row.id, { fields: Object.keys(updates) });
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
    try {
        const row = await fetchDriverOwned(req.params.id, req, next);
        if (!row) return undefined;
        await row.destroy();
        await auditLogistics(req, 'driver.deleted', 'driver', row.id);
        return sendSuccess(req, res, { id: row.id, deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, update, remove };
