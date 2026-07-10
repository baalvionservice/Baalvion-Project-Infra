'use strict';
/** Logistics Core Foundation (Phase 2) — operational warehouses. Same shape as containerController.js. */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { createWarehouseSchema, updateWarehouseSchema } = require('../validators/warehouse.schema');
const { auditLogistics } = require('../utils/logisticsAudit');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

async function fetchWarehouseOwned(id, req, next) {
    const row = await db.Warehouse.findByPk(id);
    if (!row) { next(new AppError('NOT_FOUND', 'Warehouse not found', 404)); return null; }
    if (isAdmin(req)) return row;
    const tenantId = callerTenantId(req);
    if (tenantId && row.tenant_id && row.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Warehouse not found', 404)); return null;
    }
    return row;
}

function toApi(r) {
    return {
        id: r.id, name: r.name, code: r.code, warehouseType: r.warehouse_type,
        addressId: r.address_id,
        capacitySqm: r.capacity_sqm != null ? Number(r.capacity_sqm) : null,
        capacityUnits: r.capacity_units, usedUnits: r.used_units, status: r.status,
        managerName: r.manager_name, contactPhone: r.contact_phone,
        operatingHours: r.operating_hours, metadata: r.metadata,
        createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

function fromApi(v) {
    return {
        name: v.name,
        code: v.code,
        warehouse_type: v.warehouseType,
        address_id: v.addressId,
        capacity_sqm: v.capacitySqm,
        capacity_units: v.capacityUnits,
        status: v.status,
        manager_name: v.managerName,
        contact_phone: v.contactPhone,
        operating_hours: v.operatingHours,
        metadata: v.metadata,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'name', 'status'] });
        const where = {};
        if (req.query.warehouseType) where.warehouse_type = req.query.warehouseType;
        if (req.query.status) where.status = req.query.status;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.Warehouse.findAndCountAll({ where, limit, offset, order });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await fetchWarehouseOwned(req.params.id, req, next);
        if (!row) return undefined;
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const parsed = createWarehouseSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const tenantId = callerTenantId(req);
        const row = await db.Warehouse.create({
            ...fromApi(parsed.data),
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        await auditLogistics(req, 'warehouse.created', 'warehouse', row.id, { name: row.name });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const row = await fetchWarehouseOwned(req.params.id, req, next);
        if (!row) return undefined;
        const parsed = updateWarehouseSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const updates = fromApi(parsed.data);
        Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
        await row.update(updates);
        await auditLogistics(req, 'warehouse.updated', 'warehouse', row.id, { fields: Object.keys(updates) });
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
    try {
        const row = await fetchWarehouseOwned(req.params.id, req, next);
        if (!row) return undefined;
        await row.destroy(); // paranoid: soft delete
        await auditLogistics(req, 'warehouse.deleted', 'warehouse', row.id);
        return sendSuccess(req, res, { id: row.id, deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, update, remove };
