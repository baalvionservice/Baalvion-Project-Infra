'use strict';
/**
 * Warehouse Management System, Phase A — receiving + Goods Receipt Notes.
 * Lifecycle (draft -> in_progress -> completed/cancelled) enforced via
 * service/warehouse/receivingLifecycle.js, same wrapping pattern
 * controller/fleetAssignmentController.js uses for assignmentLifecycle.js.
 */
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { parseListQuery } = require('../utils/pagination');
const {
    createGoodsReceiptNoteSchema, updateGoodsReceiptNoteSchema,
    createGoodsReceiptLineSchema, updateGoodsReceiptLineSchema,
} = require('../validators/goodsReceiptNote.schema');
const { auditLogistics } = require('../utils/logisticsAudit');
const { generateGrnNumber } = require('../service/warehouse/grnNumber');
const { assertTransition } = require('../service/warehouse/receivingLifecycle');

function isAdmin(req) {
    const roles = (req.auth && req.auth.roles) || [];
    return roles.some((r) => r === 'admin' || r === 'super_admin' || r === 'owner');
}

function callerTenantId(req) {
    return (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
}

async function fetchGrnOwned(id, req, next) {
    const row = await db.GoodsReceiptNote.findByPk(id, { include: [{ model: db.GoodsReceiptLine, as: 'lines' }] });
    if (!row) { next(new AppError('NOT_FOUND', 'Goods receipt note not found', 404)); return null; }
    if (isAdmin(req)) return row;
    const tenantId = callerTenantId(req);
    if (tenantId && row.tenant_id && row.tenant_id !== tenantId) {
        next(new AppError('NOT_FOUND', 'Goods receipt note not found', 404)); return null;
    }
    return row;
}

function lineToApi(l) {
    return {
        id: l.id, grnId: l.grn_id, packageId: l.package_id, putawayTaskId: l.putaway_task_id,
        sku: l.sku, description: l.description,
        expectedQuantity: l.expected_quantity != null ? Number(l.expected_quantity) : null,
        receivedQuantity: Number(l.received_quantity), unit: l.unit, condition: l.condition,
        lotNumber: l.lot_number, manufactureDate: l.manufacture_date, expiryDate: l.expiry_date,
        weightKg: l.weight_kg != null ? Number(l.weight_kg) : null,
        volumeCbm: l.volume_cbm != null ? Number(l.volume_cbm) : null,
        hazardClass: l.hazard_class, temperatureRequirement: l.temperature_requirement, metadata: l.metadata,
    };
}

function toApi(r) {
    return {
        id: r.id, grnNumber: r.grn_number, warehouseId: r.warehouse_id,
        purchaseOrderId: r.purchase_order_id, shipmentId: r.shipment_id, supplierReference: r.supplier_reference,
        status: r.status, receivedBy: r.received_by, receivedAt: r.received_at, notes: r.notes,
        metadata: r.metadata, createdAt: r.created_at, updatedAt: r.updated_at,
        lines: Array.isArray(r.lines) ? r.lines.map(lineToApi) : undefined,
    };
}

const list = async (req, res, next) => {
    try {
        const { limit, offset, order } = parseListQuery(req.query, { allowedSort: ['created_at', 'status'] });
        const where = {};
        if (req.query.warehouseId) where.warehouse_id = req.query.warehouseId;
        if (req.query.status) where.status = req.query.status;
        if (!isAdmin(req)) {
            const tenantId = callerTenantId(req);
            if (tenantId) where.tenant_id = tenantId;
        }
        const { count, rows } = await db.GoodsReceiptNote.findAndCountAll({ where, limit, offset, order });
        return sendPaginated(req, res, { items: rows.map(toApi), total: count, page: Number(req.query.page) || 1, limit });
    } catch (err) { return next(err); }
};

const get = async (req, res, next) => {
    try {
        const row = await fetchGrnOwned(req.params.id, req, next);
        if (!row) return undefined;
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const create = async (req, res, next) => {
    try {
        const parsed = createGoodsReceiptNoteSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const tenantId = callerTenantId(req);
        const row = await db.GoodsReceiptNote.create({
            grn_number: generateGrnNumber(),
            warehouse_id: parsed.data.warehouseId,
            purchase_order_id: parsed.data.purchaseOrderId,
            shipment_id: parsed.data.shipmentId,
            supplier_reference: parsed.data.supplierReference,
            notes: parsed.data.notes,
            metadata: parsed.data.metadata || {},
            status: 'draft',
            created_by: req.auth && req.auth.userId,
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        await auditLogistics(req, 'goods_receipt_note.created', 'goods_receipt_note', row.id, { grnNumber: row.grn_number });
        return sendSuccess(req, res, toApi(row), 201);
    } catch (err) { return next(err); }
};

const update = async (req, res, next) => {
    try {
        const row = await fetchGrnOwned(req.params.id, req, next);
        if (!row) return undefined;
        const parsed = updateGoodsReceiptNoteSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const updates = {
            supplier_reference: parsed.data.supplierReference,
            notes: parsed.data.notes,
            metadata: parsed.data.metadata,
        };
        Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
        await row.update(updates);
        await auditLogistics(req, 'goods_receipt_note.updated', 'goods_receipt_note', row.id, { fields: Object.keys(updates) });
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const addLine = async (req, res, next) => {
    try {
        const grn = await fetchGrnOwned(req.params.id, req, next);
        if (!grn) return undefined;
        if (grn.status === 'completed' || grn.status === 'cancelled') {
            return next(new AppError('INVALID_TRANSITION', `cannot add a line to a goods receipt note in '${grn.status}' state`, 409));
        }
        const parsed = createGoodsReceiptLineSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const tenantId = callerTenantId(req);
        const line = await db.GoodsReceiptLine.create({
            grn_id: grn.id,
            package_id: parsed.data.packageId,
            sku: parsed.data.sku,
            description: parsed.data.description,
            expected_quantity: parsed.data.expectedQuantity,
            received_quantity: parsed.data.receivedQuantity,
            unit: parsed.data.unit,
            condition: parsed.data.condition,
            lot_number: parsed.data.lotNumber,
            manufacture_date: parsed.data.manufactureDate,
            expiry_date: parsed.data.expiryDate,
            weight_kg: parsed.data.weightKg,
            volume_cbm: parsed.data.volumeCbm,
            hazard_class: parsed.data.hazardClass,
            temperature_requirement: parsed.data.temperatureRequirement,
            metadata: parsed.data.metadata || {},
            created_by: req.auth && req.auth.userId,
            ...(tenantId ? { tenant_id: tenantId } : {}),
        });
        if (grn.status === 'draft') {
            assertTransition('draft', 'in_progress');
            await grn.update({ status: 'in_progress' });
        }
        await auditLogistics(req, 'goods_receipt_line.created', 'goods_receipt_line', line.id, { grnId: grn.id, sku: line.sku });
        return sendSuccess(req, res, lineToApi(line), 201);
    } catch (err) { return next(err); }
};

const updateLine = async (req, res, next) => {
    try {
        const grn = await fetchGrnOwned(req.params.id, req, next);
        if (!grn) return undefined;
        const line = await db.GoodsReceiptLine.findOne({ where: { id: req.params.lineId, grn_id: grn.id } });
        if (!line) return next(new AppError('NOT_FOUND', 'Goods receipt line not found', 404));
        const parsed = updateGoodsReceiptLineSchema.safeParse(req.body || {});
        if (!parsed.success) return next(new AppError('VALIDATION_ERROR', parsed.error.issues[0].message, 400, { issues: parsed.error.issues }));
        const updates = {
            package_id: parsed.data.packageId, sku: parsed.data.sku, description: parsed.data.description,
            expected_quantity: parsed.data.expectedQuantity, received_quantity: parsed.data.receivedQuantity,
            unit: parsed.data.unit, condition: parsed.data.condition, lot_number: parsed.data.lotNumber,
            manufacture_date: parsed.data.manufactureDate, expiry_date: parsed.data.expiryDate,
            weight_kg: parsed.data.weightKg, volume_cbm: parsed.data.volumeCbm,
            hazard_class: parsed.data.hazardClass, temperature_requirement: parsed.data.temperatureRequirement,
            metadata: parsed.data.metadata,
        };
        Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);
        await line.update(updates);
        await auditLogistics(req, 'goods_receipt_line.updated', 'goods_receipt_line', line.id, { fields: Object.keys(updates) });
        return sendSuccess(req, res, lineToApi(line));
    } catch (err) { return next(err); }
};

const complete = async (req, res, next) => {
    try {
        const row = await fetchGrnOwned(req.params.id, req, next);
        if (!row) return undefined;
        try {
            assertTransition(row.status, 'completed');
        } catch (err) {
            return next(new AppError('INVALID_TRANSITION', err.message, 409));
        }
        await row.update({ status: 'completed', received_by: req.auth && req.auth.userId, received_at: new Date() });
        await auditLogistics(req, 'goods_receipt_note.completed', 'goods_receipt_note', row.id);
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

const cancel = async (req, res, next) => {
    try {
        const row = await fetchGrnOwned(req.params.id, req, next);
        if (!row) return undefined;
        try {
            assertTransition(row.status, 'cancelled');
        } catch (err) {
            return next(new AppError('INVALID_TRANSITION', err.message, 409));
        }
        await row.update({ status: 'cancelled' });
        await auditLogistics(req, 'goods_receipt_note.cancelled', 'goods_receipt_note', row.id);
        return sendSuccess(req, res, toApi(row));
    } catch (err) { return next(err); }
};

module.exports = { list, get, create, update, addLine, updateLine, complete, cancel };
