'use strict';
/**
 * Logistics Core Foundation (Phase 2) — warehouse inventory movement ledger.
 * Append-only (no update/delete), same shape as trackingController.js.
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const { auditLogistics } = require('../utils/logisticsAudit');

const MOVEMENT_TYPES = ['inbound', 'outbound', 'transfer', 'adjustment'];

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

function toApi(r) {
    return {
        id: r.id, warehouseId: r.warehouse_id, packageId: r.package_id, shipmentId: r.shipment_id,
        movementType: r.movement_type, quantity: Number(r.quantity), unit: r.unit,
        referenceType: r.reference_type, referenceId: r.reference_id,
        occurredAt: r.occurred_at, notes: r.notes, metadata: r.metadata, createdAt: r.created_at,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset } = parseListQuery(req.query, { allowedSort: ['occurred_at'] });
        const where = {};
        if (req.query.warehouseId) where.warehouse_id = req.query.warehouseId;
        if (req.query.packageId) where.package_id = req.query.packageId;
        if (req.query.shipmentId) where.shipment_id = req.query.shipmentId;
        if (req.query.movementType) where.movement_type = req.query.movementType;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.InventoryMovement.findAndCountAll({
            where, limit, offset, order: [['occurred_at', 'DESC']],
        });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await db.InventoryMovement.findByPk(req.params.id);
        if (!row) return next(new AppError('NOT_FOUND', 'Inventory movement not found', 404));
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId && row.tenant_id && row.tenant_id !== tenantId) {
                return next(new AppError('NOT_FOUND', 'Inventory movement not found', 404));
            }
        }
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const b = req.body || {};
        const warehouseId = b.warehouseId ?? b.warehouse_id;
        if (!warehouseId) return next(new AppError('BAD_REQUEST', 'warehouseId is required', 400));
        const movementType = b.movementType ?? b.movement_type;
        if (!MOVEMENT_TYPES.includes(movementType)) {
            return next(new AppError('VALIDATION_ERROR', `movementType must be one of: ${MOVEMENT_TYPES.join(', ')}`, 400));
        }
        const quantity = Number(b.quantity);
        if (!Number.isFinite(quantity)) return next(new AppError('BAD_REQUEST', 'quantity is required and must be numeric', 400));
        const tenantId = callerTenantId(req);
        const row = await db.InventoryMovement.create({
            warehouse_id: warehouseId,
            package_id: b.packageId ?? b.package_id,
            shipment_id: b.shipmentId ?? b.shipment_id,
            movement_type: movementType,
            quantity,
            unit: b.unit || 'unit',
            reference_type: b.referenceType ?? b.reference_type,
            reference_id: b.referenceId ?? b.reference_id,
            occurred_at: b.occurredAt ?? b.occurred_at ?? new Date(),
            notes: b.notes,
            metadata: b.metadata ?? {},
            created_by: req.auth && req.auth.userId,
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        // Best-effort: keep the warehouse's used_units running total current.
        try {
            const warehouse = await db.Warehouse.findByPk(warehouseId);
            if (warehouse) {
                const delta = movementType === 'outbound' ? -quantity : quantity;
                const updatedUnits = Math.max(0, (warehouse.used_units || 0) + (movementType === 'adjustment' ? 0 : delta));
                await warehouse.update({ used_units: updatedUnits });
            }
        } catch { /* non-fatal */ }
        await auditLogistics(req, 'inventory_movement.created', 'inventory_movement', row.id, { warehouseId, movementType, quantity });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

module.exports = { list, get, create };
