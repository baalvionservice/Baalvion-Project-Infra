'use strict';
const { z } = require('zod');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { QualityEvents, emitSafe } = require('../platform/events');

const tenantOf = (req) => (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;

const createSchema = z.object({
    order_id: z.string().optional(), product_id: z.string().optional(), supplier_id: z.string().optional(),
    type: z.enum(['incoming', 'in_process', 'pre_shipment', 'container_loading']),
    aql_level: z.string().optional(), scheduled_at: z.string().datetime().optional(),
});
const resultSchema = z.object({
    passed: z.boolean(),
    notes: z.string().optional(),
    defects: z.array(z.object({ severity: z.enum(['critical', 'major', 'minor']), description: z.string(), qty: z.number().int().positive().default(1) })).default([]),
});

// F2: every read/load runs inside a tenant transaction so the RLS GUC is set.
const listInspections = async (req, res, next) => {
    try {
        const { orderId, supplierId, status, page = 1, limit = 20 } = req.query;
        const where = {};
        if (orderId) where.order_id = orderId;
        if (supplierId) where.supplier_id = supplierId;
        if (status) where.status = status;
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.sequelize.transaction((t) =>
            db.Inspection.findAndCountAll({ where, limit: Number(limit), offset, order: [['created_at', 'DESC']], transaction: t }));
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) { return next(err); }
};

const getInspection = async (req, res, next) => {
    try {
        const i = await db.sequelize.transaction((t) => db.Inspection.findByPk(req.params.id, {
            include: [{ model: db.Defect, as: 'defects' }, { model: db.Capa, as: 'capa' }], transaction: t,
        }));
        if (!i) return next(new AppError('NOT_FOUND', 'Inspection not found', 404));
        return sendSuccess(req, res, i);
    } catch (err) { return next(err); }
};

const scheduleInspection = async (req, res, next) => {
    try {
        const b = createSchema.parse(req.body || {});
        const org_id = tenantOf(req);
        if (!org_id) return next(new AppError('TENANT_REQUIRED', 'Tenant context required', 400));
        const insp = await db.sequelize.transaction((t) => db.Inspection.create({ ...b, org_id, status: 'scheduled' }, { transaction: t }));
        return sendSuccess(req, res, insp, 201);
    } catch (err) { return next(err instanceof z.ZodError ? new AppError('BAD_REQUEST', err.errors[0].message, 422) : err); }
};

const startInspection = async (req, res, next) => {
    try {
        const i = await db.sequelize.transaction(async (t) => {
            const row = await db.Inspection.findByPk(req.params.id, { transaction: t });
            if (!row) throw new AppError('NOT_FOUND', 'Inspection not found', 404);
            if (row.status !== 'scheduled') throw new AppError('CONFLICT', `cannot start a ${row.status} inspection`, 409);
            await row.update({ status: 'in_progress' }, { transaction: t });
            return row;
        });
        return sendSuccess(req, res, i);
    } catch (err) { return next(err); }
};

const submitResult = async (req, res, next) => {
    try {
        const b = resultSchema.parse(req.body || {});
        const status = b.passed ? 'passed' : 'failed';
        const i = await db.sequelize.transaction(async (t) => {
            const row = await db.Inspection.findByPk(req.params.id, { transaction: t });
            if (!row) throw new AppError('NOT_FOUND', 'Inspection not found', 404);
            for (const d of b.defects) await db.Defect.create({ org_id: row.org_id, inspection_id: row.id, ...d }, { transaction: t });
            await row.update({ status, inspector_id: req.auth.userId, result: { passed: b.passed, notes: b.notes || null } }, { transaction: t });
            return row;
        });
        emitSafe(QualityEvents.COMPLETED, { inspectionId: i.id, orgId: i.org_id, orderId: i.order_id, supplierId: i.supplier_id, passed: b.passed, result: i.result }, { tenantId: i.org_id });
        return sendSuccess(req, res, i);
    } catch (err) { return next(err instanceof z.ZodError ? new AppError('BAD_REQUEST', err.errors[0].message, 422) : err); }
};

const openCapa = async (req, res, next) => {
    try {
        const { action, owner_id, due_at } = req.body || {};
        if (!action) return next(new AppError('BAD_REQUEST', 'action required', 422));
        const capa = await db.sequelize.transaction(async (t) => {
            const row = await db.Inspection.findByPk(req.params.id, { transaction: t });
            if (!row) throw new AppError('NOT_FOUND', 'Inspection not found', 404);
            return db.Capa.create({ org_id: row.org_id, inspection_id: row.id, action, owner_id, due_at }, { transaction: t });
        });
        return sendSuccess(req, res, capa, 201);
    } catch (err) { return next(err); }
};

module.exports = { listInspections, getInspection, scheduleInspection, startInspection, submitResult, openCapa };
