'use strict';
const { z } = require('zod');
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { SupplierEvents, emitSafe } = require('../platform/events');
const { canTransition } = require('../services/lifecycle');

const tenantOf = (req) => (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;
const createSchema = z.object({ legal_name: z.string().min(1), country: z.string().length(2) });

// Permissive pagination guard for GET /suppliers. Mirrors the prior manual
// defaults (page=1, limit=20) and only adds a sane max page-size cap so an
// unbounded `limit` cannot force an oversized scan. Invalid/missing values fall
// back to defaults rather than rejecting the request (never stricter than before).
const MAX_PAGE_SIZE = 100;
const listQuerySchema = z.object({
    page: z.coerce.number().int().min(1).catch(1).default(1),
    limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).catch(20).default(20),
});

// F2: every read/load runs inside a tenant transaction so the RLS GUC is set.
const listSuppliers = async (req, res, next) => {
    try {
        const { stage, country, q } = req.query;
        const { page, limit } = listQuerySchema.parse(req.query);
        const where = {};
        if (stage) where.stage = stage;
        if (country) where.country = country.toUpperCase();
        if (q) where.legal_name = { [Op.iLike]: `%${q}%` };
        const offset = (page - 1) * limit;
        const { count, rows } = await db.sequelize.transaction((t) =>
            db.Supplier.findAndCountAll({ where, limit, offset, order: [['created_at', 'DESC']], transaction: t }));
        return sendPaginated(req, res, { items: rows, total: count, page, limit });
    } catch (err) { return next(err); }
};

const getSupplier = async (req, res, next) => {
    try {
        const s = await db.sequelize.transaction((t) => db.Supplier.findByPk(req.params.id, {
            include: [{ model: db.QualificationDoc, as: 'qualificationDocs' }, { model: db.Scorecard, as: 'scorecards' }], transaction: t,
        }));
        if (!s) return next(new AppError('NOT_FOUND', 'Supplier not found', 404));
        return sendSuccess(req, res, s);
    } catch (err) { return next(err); }
};

// F6: idempotent create — keyed on the natural unique (org_id, legal_name, country).
// A repeated request (retry/double-submit) returns the existing supplier (200)
// instead of erroring on the unique constraint or creating a duplicate.
// SELECT-first covers sequential retries; the outer unique-catch covers a
// concurrent race (the aborted txn rolls back, then we re-read in a fresh one).
// NOTE: deliberately NOT Sequelize findOrCreate — it uses the unmanaged
// transaction form, which this service's tenant-GUC transaction patch rejects.
const findExisting = (t, org_id, legal_name, country) =>
    db.Supplier.findOne({ where: { org_id, legal_name, country }, transaction: t });

const createSupplier = async (req, res, next) => {
    try {
        const b = createSchema.parse(req.body || {});
        const org_id = tenantOf(req);
        if (!org_id) return next(new AppError('TENANT_REQUIRED', 'Tenant context required', 400));
        const country = b.country.toUpperCase();
        const { supplier, created } = await db.sequelize.transaction(async (t) => {
            const existing = await findExisting(t, org_id, b.legal_name, country);
            if (existing) return { supplier: existing, created: false };
            const s = await db.Supplier.create({ org_id, legal_name: b.legal_name, country, stage: 'prospect' }, { transaction: t });
            return { supplier: s, created: true };
        });
        return sendSuccess(req, res, supplier, created ? 201 : 200);
    } catch (err) {
        if (err instanceof z.ZodError) return next(new AppError('BAD_REQUEST', err.errors[0].message, 422));
        if (err.name === 'SequelizeUniqueConstraintError') {
            // Lost a concurrent race — return the now-existing row idempotently.
            try {
                const org_id = tenantOf(req);
                const country = ((req.body || {}).country || '').toUpperCase();
                const existing = await db.sequelize.transaction((t) => findExisting(t, org_id, (req.body || {}).legal_name, country));
                if (existing) return sendSuccess(req, res, existing, 200);
            } catch (reReadErr) {
                // Idempotent re-read after a concurrent unique-race failed; log
                // and fall through to the original error handler (control flow unchanged).
                console.error('[supplier-lifecycle-service] idempotent re-read after unique race failed:', reReadErr && reReadErr.message);
            }
        }
        return next(err);
    }
};

const transition = async (req, res, next) => {
    try {
        const { toStage, reason } = req.body || {};
        const { supplier, fromStage } = await db.sequelize.transaction(async (t) => {
            const row = await db.Supplier.findByPk(req.params.id, { transaction: t });
            if (!row) throw new AppError('NOT_FOUND', 'Supplier not found', 404);
            if (!canTransition(row.stage, toStage)) throw new AppError('CONFLICT', `illegal transition ${row.stage} → ${toStage}`, 409);
            const prev = row.stage;
            await row.update({ stage: toStage, metadata: { ...(row.metadata || {}), lastReason: reason || null } }, { transaction: t });
            return { supplier: row, fromStage: prev };
        });
        emitSafe(SupplierEvents.STAGE_CHANGED, { supplierId: supplier.id, orgId: supplier.org_id, fromStage, toStage }, { tenantId: supplier.org_id });
        return sendSuccess(req, res, supplier);
    } catch (err) { return next(err); }
};

const addDoc = async (req, res, next) => {
    try {
        const { doc_type, expires_at } = req.body || {};
        if (!doc_type) return next(new AppError('BAD_REQUEST', 'doc_type required', 422));
        const doc = await db.sequelize.transaction(async (t) => {
            const s = await db.Supplier.findByPk(req.params.id, { transaction: t });
            if (!s) throw new AppError('NOT_FOUND', 'Supplier not found', 404);
            return db.QualificationDoc.create({ org_id: s.org_id, supplier_id: s.id, doc_type, expires_at }, { transaction: t });
        });
        return sendSuccess(req, res, doc, 201);
    } catch (err) { return next(err); }
};

const getScorecard = async (req, res, next) => {
    try {
        const where = { supplier_id: req.params.id };
        if (req.query.period) where.period = req.query.period;
        const cards = await db.sequelize.transaction((t) =>
            db.Scorecard.findAll({ where, order: [['period', 'DESC']], limit: req.query.period ? 1 : 8, transaction: t }));
        return sendSuccess(req, res, { supplierId: req.params.id, scorecards: cards });
    } catch (err) { return next(err); }
};

const blacklist = async (req, res, next) => {
    try {
        const { supplier, fromStage } = await db.sequelize.transaction(async (t) => {
            const row = await db.Supplier.findByPk(req.params.id, { transaction: t });
            if (!row) throw new AppError('NOT_FOUND', 'Supplier not found', 404);
            const prev = row.stage;
            await row.update({ stage: 'blacklisted', metadata: { ...(row.metadata || {}), blacklistReason: (req.body || {}).reason || null } }, { transaction: t });
            return { supplier: row, fromStage: prev };
        });
        emitSafe(SupplierEvents.STAGE_CHANGED, { supplierId: supplier.id, orgId: supplier.org_id, fromStage, toStage: 'blacklisted' }, { tenantId: supplier.org_id });
        return sendSuccess(req, res, supplier);
    } catch (err) { return next(err); }
};

module.exports = { listSuppliers, getSupplier, createSupplier, transition, addDoc, getScorecard, blacklist };
