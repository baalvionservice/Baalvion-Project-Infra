'use strict';
/** Logistics Core Foundation (Phase 1) — package/cargo units. Same shape as containerController.js. */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { createPackageSchema, updatePackageSchema } = require('../validators/package.schema');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

async function fetchPackageOwned(id, req, next) {
    const row = await db.LogisticsPackage.findByPk(id);
    if (!row) { next(new AppError('NOT_FOUND', 'Package not found', 404)); return null; }
    if (isAdmin(req)) return row;
    const tenantId = callerTenantId(req);
    if (tenantId && row.tenant_id && row.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Package not found', 404)); return null;
    }
    return row;
}

function toApi(r) {
    return {
        id: r.id, shipmentId: r.shipment_id, containerId: r.container_id,
        packageType: r.package_type,
        lengthCm: r.length_cm != null ? Number(r.length_cm) : null,
        widthCm: r.width_cm != null ? Number(r.width_cm) : null,
        heightCm: r.height_cm != null ? Number(r.height_cm) : null,
        weightKg: r.weight_kg != null ? Number(r.weight_kg) : null,
        volumeCbm: r.volume_cbm != null ? Number(r.volume_cbm) : null,
        barcode: r.barcode, qrCode: r.qr_code, rfidTag: r.rfid_tag, sku: r.sku,
        hsCode: r.hs_code, commodityDescription: r.commodity_description,
        packagingMaterial: r.packaging_material, sealNumber: r.seal_number,
        metadata: r.metadata, createdAt: r.created_at, updatedAt: r.updated_at,
    };
}

function fromApi(v) {
    return {
        shipment_id: v.shipmentId,
        container_id: v.containerId,
        package_type: v.packageType,
        length_cm: v.lengthCm,
        width_cm: v.widthCm,
        height_cm: v.heightCm,
        weight_kg: v.weightKg,
        volume_cbm: v.volumeCbm,
        barcode: v.barcode,
        qr_code: v.qrCode,
        rfid_tag: v.rfidTag,
        sku: v.sku,
        hs_code: v.hsCode,
        commodity_description: v.commodityDescription,
        packaging_material: v.packagingMaterial,
        seal_number: v.sealNumber,
        metadata: v.metadata,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'barcode', 'package_type'] });
        const where = {};
        if (req.query.shipmentId) where.shipment_id = req.query.shipmentId;
        if (req.query.containerId) where.container_id = req.query.containerId;
        if (req.query.packageType) where.package_type = req.query.packageType;
        if (req.query.barcode) where.barcode = req.query.barcode;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.LogisticsPackage.findAndCountAll({ where, limit, offset, order });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await fetchPackageOwned(req.params.id, req, next);
        if (!row) return undefined;
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const parsed = createPackageSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const tenantId = callerTenantId(req);
        const row = await db.LogisticsPackage.create({
            ...fromApi(parsed.data),
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const row = await fetchPackageOwned(req.params.id, req, next);
        if (!row) return undefined;
        const parsed = updatePackageSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const updates = fromApi(parsed.data);
        Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
        await row.update(updates);
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const remove = async (req, res, next) => {
    try {
        const row = await fetchPackageOwned(req.params.id, req, next);
        if (!row) return undefined;
        await row.destroy();
        return sendSuccess(req, res, { id: row.id, deleted: true });
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, update, remove };
