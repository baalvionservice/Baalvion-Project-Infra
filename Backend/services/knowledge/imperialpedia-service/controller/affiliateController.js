'use strict';
const db = require('../models');
const { sendSuccess, sendPaginated } = require('../utils/response');
const { AppError } = require('../utils/errors');
const { createAffiliateProductSchema, updateAffiliateProductSchema } = require('../validators/schemas');
const { generateTrackingCode } = require('../utils/trackingCode');
const affiliateReportService = require('../service/affiliateReportService');

const PRIVILEGED_ROLES = ['admin', 'owner', 'super_admin'];
const isPrivilegedCaller = (req) => ((req.auth && req.auth.roles) || []).some((r) => PRIVILEGED_ROLES.includes(r));

const buildPagination = (total, page, limit) => ({ total, page, limit, totalPages: Math.ceil(total / limit) });

// Validate with Zod → AppError(400) with flattened details (same helper shape as glossaryController.js).
const validate = (schema, data) => {
    const result = schema.safeParse(data);
    if (!result.success) {
        const err = new AppError('VALIDATION_ERROR', 'Validation failed', 400);
        err.details = result.error.flatten();
        throw err;
    }
    return result.data;
};

// GET /affiliate-products — public sees only active products; staff (admin/owner/super_admin)
// sees every status, for moderation.
const listAffiliateProducts = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const offset = (page - 1) * limit;
        const where = {};

        const isPrivileged = isPrivilegedCaller(req);
        if (req.query.status && isPrivileged) {
            const requestedStatus = String(req.query.status);
            // 'all' — admin moderation view, no where.status filter at all (see the identical
            // fix in articlesController.js's listArticles for why this needs special-casing:
            // 'all' is not a valid value for the status ENUM column).
            if (requestedStatus !== 'all') where.status = requestedStatus;
        } else {
            where.status = 'active';
        }
        if (req.query.category) where.category = req.query.category;
        if (req.query.article_id) where.article_id = parseInt(req.query.article_id);

        const { count, rows } = await db.AffiliateProduct.findAndCountAll({
            where, limit, offset, order: [['created_at', 'DESC']],
        });

        return sendPaginated(req, res, { items: rows, pagination: buildPagination(count, page, limit) });
    } catch (err) { return next(err); }
};

// POST /affiliate-products — staff only. Affiliate commission relationships are an editorial/
// business decision, unlike article authorship, so this isn't author-self-service like articles.
const createAffiliateProduct = async (req, res, next) => {
    try {
        if (!isPrivilegedCaller(req)) return next(new AppError('FORBIDDEN', 'Not authorized', 403));

        const data = validate(createAffiliateProductSchema, req.body);

        // Retry on the (rare) tracking_code collision — the unique index is the real guard,
        // this just avoids surfacing a raw constraint-violation error to the caller.
        for (let attempt = 0; attempt < 5; attempt++) {
            try {
                const product = await db.AffiliateProduct.create({ ...data, tracking_code: generateTrackingCode() });
                return sendSuccess(req, res, product, 201);
            } catch (err) {
                const isTrackingCodeConflict = err.name === 'SequelizeUniqueConstraintError' &&
                    (err.errors || []).some((e) => e.path === 'tracking_code');
                if (!isTrackingCodeConflict) throw err;
            }
        }
        return next(new AppError('INTERNAL_SERVER_ERROR', 'Could not allocate a unique tracking code', 500));
    } catch (err) { return next(err); }
};

// GET /affiliate-products/:id — staff only (the public surface is the list + the /r/:code redirect).
const getAffiliateProduct = async (req, res, next) => {
    try {
        if (!isPrivilegedCaller(req)) return next(new AppError('FORBIDDEN', 'Not authorized', 403));
        const product = await db.AffiliateProduct.findByPk(req.params.id);
        if (!product) return next(new AppError('NOT_FOUND', 'Affiliate product not found', 404));
        return sendSuccess(req, res, product);
    } catch (err) { return next(err); }
};

// PATCH /affiliate-products/:id — staff only.
const updateAffiliateProduct = async (req, res, next) => {
    try {
        if (!isPrivilegedCaller(req)) return next(new AppError('FORBIDDEN', 'Not authorized', 403));
        const product = await db.AffiliateProduct.findByPk(req.params.id);
        if (!product) return next(new AppError('NOT_FOUND', 'Affiliate product not found', 404));

        const data = validate(updateAffiliateProductSchema, req.body);
        await product.update(data);
        return sendSuccess(req, res, product);
    } catch (err) { return next(err); }
};

// DELETE /affiliate-products/:id — staff only, soft (archive) — mirrors deleteArticle.
const deleteAffiliateProduct = async (req, res, next) => {
    try {
        if (!isPrivilegedCaller(req)) return next(new AppError('FORBIDDEN', 'Not authorized', 403));
        const product = await db.AffiliateProduct.findByPk(req.params.id);
        if (!product) return next(new AppError('NOT_FOUND', 'Affiliate product not found', 404));

        await product.update({ status: 'archived' });
        return sendSuccess(req, res, { message: 'Affiliate product archived' });
    } catch (err) { return next(err); }
};

// GET /affiliate-products/reports/summary — staff only. ?groupBy=merchant|category|contentType|
// product, ?from=ISO, ?to=ISO, ?format=json|csv (default json).
const getAffiliateReport = async (req, res, next) => {
    try {
        if (!isPrivilegedCaller(req)) return next(new AppError('FORBIDDEN', 'Not authorized', 403));

        const report = await affiliateReportService.buildReport({
            groupBy: req.query.groupBy,
            from: req.query.from,
            to: req.query.to,
        });

        if (String(req.query.format).toLowerCase() === 'csv') {
            const csv = affiliateReportService.toCsv(report);
            const filename = `affiliate-report-${report.groupBy}-${new Date().toISOString().slice(0, 10)}.csv`;
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            return res.status(200).send(csv);
        }

        return sendSuccess(req, res, report);
    } catch (err) { return next(err); }
};

module.exports = {
    listAffiliateProducts,
    createAffiliateProduct,
    getAffiliateProduct,
    updateAffiliateProduct,
    deleteAffiliateProduct,
    getAffiliateReport,
};
