'use strict';
const { z } = require('zod');
const { Op } = require('sequelize');
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { ProductEvents, emitSafe } = require('../platform/events');

const tenantOf = (req) => (req.auth && (req.auth.tenantId || req.auth.orgId)) || null;

const createSchema = z.object({
    sku: z.string().min(1), gtin: z.string().optional(), name: z.string().min(1),
    hs_code: z.string().min(4), uom: z.string().default('EA'),
    origin_country: z.string().length(2).optional(), hazmat: z.boolean().default(false),
    attributes: z.record(z.any()).default({}),
});

// F2: every read/load runs inside a tenant transaction so the RLS GUC is set;
// otherwise FORCE RLS returns zero rows on the un-scoped pooled connection.
const listProducts = async (req, res, next) => {
    try {
        const { hsCode, status, q, page = 1, limit = 20 } = req.query;
        const where = {};
        if (hsCode) where.hs_code = { [Op.like]: `${hsCode}%` };
        if (status) where.status = status;
        if (q) where.name = { [Op.iLike]: `%${q}%` };
        const offset = (Number(page) - 1) * Number(limit);
        const { count, rows } = await db.sequelize.transaction((t) =>
            db.Product.findAndCountAll({ where, limit: Number(limit), offset, order: [['created_at', 'DESC']], transaction: t }));
        return sendPaginated(req, res, { items: rows, total: count, page: Number(page), limit: Number(limit) });
    } catch (err) { return next(err); }
};

const getProduct = async (req, res, next) => {
    try {
        const p = await db.sequelize.transaction((t) => db.Product.findByPk(req.params.id, { transaction: t }));
        if (!p) return next(new AppError('NOT_FOUND', 'Product not found', 404));
        return sendSuccess(req, res, p);
    } catch (err) { return next(err); }
};

const createProduct = async (req, res, next) => {
    try {
        const body = createSchema.parse(req.body || {});
        const org_id = tenantOf(req);
        if (!org_id) return next(new AppError('TENANT_REQUIRED', 'Tenant context required', 400));
        const product = await db.sequelize.transaction((t) => db.Product.create({ ...body, org_id }, { transaction: t }));
        emitSafe(ProductEvents.UPSERTED, { productId: product.id, orgId: org_id, sku: product.sku, hsCode: product.hs_code }, { tenantId: org_id });
        return sendSuccess(req, res, product, 201);
    } catch (err) { return next(err instanceof z.ZodError ? new AppError('BAD_REQUEST', err.errors[0].message, 422) : err); }
};

const updateProduct = async (req, res, next) => {
    try {
        const p = await db.sequelize.transaction(async (t) => {
            const row = await db.Product.findByPk(req.params.id, { transaction: t });
            if (!row) throw new AppError('NOT_FOUND', 'Product not found', 404);
            await row.update(req.body || {}, { transaction: t });
            return row;
        });
        emitSafe(ProductEvents.UPSERTED, { productId: p.id, orgId: p.org_id, sku: p.sku, hsCode: p.hs_code }, { tenantId: p.org_id });
        return sendSuccess(req, res, p);
    } catch (err) { return next(err); }
};

const retireProduct = async (req, res, next) => {
    try {
        const p = await db.sequelize.transaction(async (t) => {
            const row = await db.Product.findByPk(req.params.id, { transaction: t });
            if (!row) throw new AppError('NOT_FOUND', 'Product not found', 404);
            await row.update({ status: 'retired' }, { transaction: t });
            return row;
        });
        return sendSuccess(req, res, p);
    } catch (err) { return next(err); }
};

const hsRequirements = async (req, res, next) => {
    try {
        const dest = (req.query.dest || '').toUpperCase();
        const docs = await db.sequelize.transaction((t) => db.HsDocRequirement.findAll({
            where: { hs_prefix: { [Op.in]: prefixes(req.params.hsCode) }, ...(dest ? { dest_country: dest } : {}) },
            transaction: t,
        }));
        return sendSuccess(req, res, { hsCode: req.params.hsCode, dest, docs });
    } catch (err) { return next(err); }
};
const prefixes = (hs) => { const out = []; for (let i = 2; i <= hs.length; i += 2) out.push(hs.slice(0, i)); return out; };

module.exports = { listProducts, getProduct, createProduct, updateProduct, retireProduct, hsRequirements };
