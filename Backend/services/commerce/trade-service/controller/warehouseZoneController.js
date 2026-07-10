'use strict';
/** Warehouse Management System, Phase A — warehouse zones. Same shape as warehouseController.js. */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { createWarehouseZoneSchema, updateWarehouseZoneSchema } = require('../validators/warehouseZone.schema');
const { auditLogistics } = require('../utils/logisticsAudit');
const { generateLocationCode } = require('../service/warehouse/locationCode');
const { renderLabelSvg } = require('../service/warehouse/qrLabel');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

async function fetchZoneOwned(id, req, next) {
    const row = await db.WarehouseZone.findByPk(id);
    if (!row) { next(new AppError('NOT_FOUND', 'Warehouse zone not found', 404)); return null; }
    if (isAdmin(req)) return row;
    const tenantId = callerTenantId(req);
    if (tenantId && row.tenant_id && row.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Warehouse zone not found', 404)); return null;
    }
    return row;
}

function toApi(r) {
    return {
        id: r.id, warehouseId: r.warehouse_id, code: r.code, name: r.name, zoneType: r.zone_type,
        temperatureZone: r.temperature_zone, hazardClass: r.hazard_class,
        capacityUnits: r.capacity_units, usedUnits: r.used_units, sequenceOrder: r.sequence_order,
        status: r.status, barcode: r.barcode, qrPayload: r.qr_payload, metadata: r.metadata,
        createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

function fromApi(v) {
    return {
        code: v.code, name: v.name, zone_type: v.zoneType,
        temperature_zone: v.temperatureZone, hazard_class: v.hazardClass,
        capacity_units: v.capacityUnits, sequence_order: v.sequenceOrder,
        status: v.status, metadata: v.metadata,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'name', 'sequence_order', 'status'] });
        const where = {};
        if (req.query.warehouseId) where.warehouse_id = req.query.warehouseId;
        if (req.query.zoneType) where.zone_type = req.query.zoneType;
        if (req.query.status) where.status = req.query.status;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.WarehouseZone.findAndCountAll({ where, limit, offset, order });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await fetchZoneOwned(req.params.id, req, next);
        if (!row) return undefined;
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const parsed = createWarehouseZoneSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const tenantId = callerTenantId(req);
        const code = generateLocationCode('zone');
        const row = await db.WarehouseZone.create({
            warehouse_id: parsed.data.warehouseId,
            ...fromApi(parsed.data),
            barcode: code,
            qr_payload: code,
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        await auditLogistics(req, 'warehouse_zone.created', 'warehouse_zone', row.id, { name: row.name });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const row = await fetchZoneOwned(req.params.id, req, next);
        if (!row) return undefined;
        const parsed = updateWarehouseZoneSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const updates = fromApi(parsed.data);
        Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
        await row.update(updates);
        await auditLogistics(req, 'warehouse_zone.updated', 'warehouse_zone', row.id, { fields: Object.keys(updates) });
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
    try {
        const row = await fetchZoneOwned(req.params.id, req, next);
        if (!row) return undefined;
        await row.destroy(); // paranoid: soft delete
        await auditLogistics(req, 'warehouse_zone.deleted', 'warehouse_zone', row.id);
        return sendSuccess(req, res, { id: row.id, deleted: true });
    } catch (err) { return next(err); }
};

const label = async (req, res, next) => {
    try {
        const row = await fetchZoneOwned(req.params.id, req, next);
        if (!row) return undefined;
        const svg = await renderLabelSvg(row.qr_payload || row.barcode || row.id);
        res.set('Content-Type', 'image/svg+xml');
        return res.status(200).send(svg);
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, update, remove, label };
