'use strict';
/** Warehouse Management System, Phase A — warehouse bins (aisle/rack/shelf/bin). Same shape as warehouseController.js. */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { createWarehouseBinSchema, updateWarehouseBinSchema } = require('../validators/warehouseBin.schema');
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

async function fetchBinOwned(id, req, next) {
    const row = await db.WarehouseBin.findByPk(id);
    if (!row) { next(new AppError('NOT_FOUND', 'Warehouse bin not found', 404)); return null; }
    if (isAdmin(req)) return row;
    const tenantId = callerTenantId(req);
    if (tenantId && row.tenant_id && row.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Warehouse bin not found', 404)); return null;
    }
    return row;
}

function toApi(r) {
    return {
        id: r.id, warehouseId: r.warehouse_id, zoneId: r.zone_id, parentBinId: r.parent_bin_id,
        binType: r.bin_type, code: r.code, name: r.name, path: r.path,
        capacityWeightKg: r.capacity_weight_kg != null ? Number(r.capacity_weight_kg) : null,
        capacityVolumeCbm: r.capacity_volume_cbm != null ? Number(r.capacity_volume_cbm) : null,
        capacityUnits: r.capacity_units,
        usedWeightKg: Number(r.used_weight_kg), usedVolumeCbm: Number(r.used_volume_cbm), usedUnits: r.used_units,
        temperatureZone: r.temperature_zone, hazardClass: r.hazard_class, abcClass: r.abc_class,
        status: r.status, barcode: r.barcode, qrPayload: r.qr_payload, metadata: r.metadata,
        createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

function fromApi(v) {
    return {
        zone_id: v.zoneId, parent_bin_id: v.parentBinId, bin_type: v.binType, code: v.code, name: v.name,
        capacity_weight_kg: v.capacityWeightKg, capacity_volume_cbm: v.capacityVolumeCbm, capacity_units: v.capacityUnits,
        temperature_zone: v.temperatureZone, hazard_class: v.hazardClass, abc_class: v.abcClass,
        status: v.status, metadata: v.metadata,
    };
}

async function buildPath(zoneId, parentBinId) {
    const zone = await db.WarehouseZone.findByPk(zoneId);
    const zoneCode = (zone && zone.code) || (zone && zone.name) || 'Z';
    if (!parentBinId) return zoneCode;
    const parent = await db.WarehouseBin.findByPk(parentBinId);
    if (!parent) return zoneCode;
    return `${parent.path || zoneCode}/${parent.code || parent.id.slice(0, 8)}`;
}

const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'name', 'status'] });
        const where = {};
        if (req.query.warehouseId) where.warehouse_id = req.query.warehouseId;
        if (req.query.zoneId) where.zone_id = req.query.zoneId;
        if (req.query.parentBinId) where.parent_bin_id = req.query.parentBinId;
        if (req.query.binType) where.bin_type = req.query.binType;
        if (req.query.status) where.status = req.query.status;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.WarehouseBin.findAndCountAll({ where, limit, offset, order });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await fetchBinOwned(req.params.id, req, next);
        if (!row) return undefined;
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const parsed = createWarehouseBinSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const tenantId = callerTenantId(req);
        const code = generateLocationCode('bin');
        const path = await buildPath(parsed.data.zoneId, parsed.data.parentBinId);
        const row = await db.WarehouseBin.create({
            warehouse_id: parsed.data.warehouseId,
            ...fromApi(parsed.data),
            path,
            barcode: code,
            qr_payload: code,
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        await auditLogistics(req, 'warehouse_bin.created', 'warehouse_bin', row.id, { code: row.code, binType: row.bin_type });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const row = await fetchBinOwned(req.params.id, req, next);
        if (!row) return undefined;
        const parsed = updateWarehouseBinSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const updates = fromApi(parsed.data);
        Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
        await row.update(updates);
        await auditLogistics(req, 'warehouse_bin.updated', 'warehouse_bin', row.id, { fields: Object.keys(updates) });
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
    try {
        const row = await fetchBinOwned(req.params.id, req, next);
        if (!row) return undefined;
        await row.destroy(); // paranoid: soft delete
        await auditLogistics(req, 'warehouse_bin.deleted', 'warehouse_bin', row.id);
        return sendSuccess(req, res, { id: row.id, deleted: true });
    } catch (err) { return next(err); }
};

const label = async (req, res, next) => {
    try {
        const row = await fetchBinOwned(req.params.id, req, next);
        if (!row) return undefined;
        const svg = await renderLabelSvg(row.qr_payload || row.barcode || row.id);
        res.set('Content-Type', 'image/svg+xml');
        return res.status(200).send(svg);
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, update, remove, label };
