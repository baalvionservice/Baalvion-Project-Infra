'use strict';
// Product reviews & ratings — customer submission, server-side verified-purchase detection,
// aggregate rollup into the product, and store-team moderation. All trust-sensitive values
// (verified_purchase, status, AVG/COUNT aggregates) are computed here on the server; the client
// only supplies rating/title/body. Author identity is never leaked: the public listing exposes a
// privacy-safe display name (first name + last initial), never the email or user id.
const { QueryTypes } = require('sequelize');
const { CommerceProduct, CommerceReview, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination } = require('../utils/pagination');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const asObject = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

// Resolve a product within a store by UUID or slug (mirrors storefrontService.getProduct). For
// reviews we resolve regardless of published status on the moderation paths, but the public list
// path passes publicOnly=true to only surface reviews on live products.
async function resolveProduct(storeId, idOrSlug, { publicOnly = false } = {}) {
    const idClause = UUID_RE.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
    const where = { storeId, ...idClause };
    if (publicOnly) Object.assign(where, { status: 'published', visibility: 'public' });
    const product = await CommerceProduct.findOne({ where });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    return product;
}

// SERVER-SIDE verified-purchase check: does this user have a PAID order in this store that
// contains this product? Raw cross-schema read in the same DB. Never client-supplied.
async function hasPaidPurchase(storeId, userId, productId) {
    const rows = await sequelize.query(
        `SELECT 1
           FROM orders.orders_orders o
           JOIN orders.orders_customers c ON c.id = o.customer_id
           JOIN orders.orders_order_items i ON i.order_id = o.id
          WHERE c.store_id = :storeId
            AND c.user_id = :userId
            AND i.product_id = :productId
            AND o.payment_status = 'paid'
          LIMIT 1`,
        { type: QueryTypes.SELECT, replacements: { storeId, userId: String(userId), productId } }
    );
    return rows.length > 0;
}

// Privacy-safe display name for a reviewer, resolved from the orders customer record when present.
// Returns "First L." style; falls back to a generic label so we never expose email/user id.
async function resolveAuthorName(storeId, userId, isVerified) {
    const fallback = isVerified ? 'Verified Client' : 'Client';
    if (!userId) return fallback;
    const rows = await sequelize.query(
        `SELECT first_name, last_name
           FROM orders.orders_customers
          WHERE store_id = :storeId AND user_id = :userId
          LIMIT 1`,
        { type: QueryTypes.SELECT, replacements: { storeId, userId: String(userId) } }
    );
    const c = rows[0];
    if (!c) return fallback;
    const first = (c.first_name || '').trim();
    const last = (c.last_name || '').trim();
    if (!first && !last) return fallback;
    const lastInitial = last ? ` ${last.charAt(0).toUpperCase()}.` : '';
    return `${first}${lastInitial}`.trim() || fallback;
}

// Recompute AVG(rating)/COUNT over APPROVED reviews and mirror into the product's custom_fields
// (rating + reviewsCount) so the existing storefront serializer surfaces them with no read joins.
async function recomputeAggregate(product, transaction) {
    const [agg] = await CommerceReview.findAll({
        where: { productId: product.id, status: 'approved' },
        attributes: [
            [sequelize.fn('COALESCE', sequelize.fn('AVG', sequelize.col('rating')), 0), 'avg'],
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        raw: true,
        transaction,
    });
    const rating = Math.round((Number(agg.avg) || 0) * 10) / 10; // one decimal place
    const reviewsCount = Number(agg.count) || 0;
    const cf = asObject(product.customFields);
    await product.update({ customFields: { ...cf, rating, reviewsCount } }, { transaction });
    return { rating, reviewsCount };
}

// Create or update (one per product+user) a review. userId is required. verified_purchase and
// status are server-derived: verified purchases auto-approve; otherwise they go to 'pending'.
async function createReview(storeId, productId, userId, body) {
    if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required to submit a review', 401);
    const product = await resolveProduct(storeId, productId);

    const isVerifiedPurchase = await hasPaidPurchase(storeId, userId, product.id);
    const status = isVerifiedPurchase ? 'approved' : 'pending';

    const result = await sequelize.transaction(async (transaction) => {
        const existing = await CommerceReview.findOne({
            where: { productId: product.id, userId: String(userId) },
            transaction,
        });
        const fields = {
            rating: body.rating,
            title: body.title ?? null,
            body: body.body ?? null,
            isVerifiedPurchase,
            status,
        };
        let review;
        if (existing) {
            review = await existing.update(fields, { transaction });
        } else {
            review = await CommerceReview.create(
                { ...fields, productId: product.id, storeId, userId: String(userId) },
                { transaction }
            );
        }
        await recomputeAggregate(product, transaction);
        return review;
    });

    const author = await resolveAuthorName(storeId, userId, isVerifiedPurchase);
    return serializeReview(result, author);
}

// Public per-product listing — APPROVED only, newest first, paginated, privacy-safe authors.
async function listProductReviews(storeId, idOrSlug, query = {}) {
    const product = await resolveProduct(storeId, idOrSlug, { publicOnly: true });
    const { page, limit, offset } = parsePagination(query, 100);

    const { rows, count } = await CommerceReview.findAndCountAll({
        where: { productId: product.id, status: 'approved' },
        order: [['created_at', 'DESC']],
        limit,
        offset,
    });

    const items = await Promise.all(
        rows.map(async (r) => serializeReview(r, await resolveAuthorName(storeId, r.userId, r.isVerifiedPurchase)))
    );
    return {
        items,
        total: count,
        page,
        pageSize: limit,
        totalPages: Math.max(1, Math.ceil(count / limit)),
    };
}

// The authenticated caller's own review for a product (any status), or null.
async function getMyReview(storeId, productId, userId) {
    if (!userId) throw new AppError('UNAUTHORIZED', 'Authentication required', 401);
    const product = await resolveProduct(storeId, productId);
    const review = await CommerceReview.findOne({ where: { productId: product.id, userId: String(userId) } });
    if (!review) return null;
    const author = await resolveAuthorName(storeId, userId, review.isVerifiedPurchase);
    return serializeReview(review, author, { includeStatus: true });
}

// Moderation listing — ANY status, paginated, scoped to a store + product.
async function listAllReviews(storeId, productId, query = {}) {
    const product = await resolveProduct(storeId, productId);
    const { page, limit, offset } = parsePagination(query, 100);
    const where = { storeId, productId: product.id };
    if (query.status && ['pending', 'approved', 'rejected'].includes(query.status)) where.status = query.status;

    const { rows, count } = await CommerceReview.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit,
        offset,
    });
    const items = await Promise.all(
        rows.map(async (r) => serializeReview(r, await resolveAuthorName(storeId, r.userId, r.isVerifiedPurchase), { includeStatus: true }))
    );
    return {
        items,
        total: count,
        page,
        pageSize: limit,
        totalPages: Math.max(1, Math.ceil(count / limit)),
    };
}

// Store-team moderation: set status and/or attach a reply, then recompute the aggregate (a
// status change to/from 'approved' alters the rollup).
async function moderateReview(storeId, productId, reviewId, body) {
    const product = await resolveProduct(storeId, productId);
    const review = await CommerceReview.findOne({ where: { id: reviewId, storeId, productId: product.id } });
    if (!review) throw new AppError('NOT_FOUND', 'Review not found', 404);

    const updated = await sequelize.transaction(async (transaction) => {
        const fields = {};
        if (body.status !== undefined) fields.status = body.status;
        if (body.reply !== undefined) {
            fields.reply = body.reply;
            fields.replyAt = new Date();
        }
        const r = await review.update(fields, { transaction });
        await recomputeAggregate(product, transaction);
        return r;
    });

    const author = await resolveAuthorName(storeId, updated.userId, updated.isVerifiedPurchase);
    return serializeReview(updated, author, { includeStatus: true });
}

// Public-safe review shape. status is only included on moderation/own-review paths.
function serializeReview(r, author, { includeStatus = false } = {}) {
    const out = {
        id: r.id,
        rating: r.rating,
        title: r.title || null,
        body: r.body || null,
        author,
        isVerifiedPurchase: !!r.isVerifiedPurchase,
        createdAt: r.createdAt,
        reply: r.reply || null,
        replyAt: r.replyAt || null,
    };
    if (includeStatus) out.status = r.status;
    return out;
}

module.exports = {
    createReview,
    listProductReviews,
    getMyReview,
    listAllReviews,
    moderateReview,
};
