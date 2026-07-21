'use strict';
const { Op } = require('sequelize');
const { CommerceProduct, CommerceProductVariant, CommerceProductPricing, CommerceProductMedia, CommerceCategory, CommerceStore, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
const { demoteFromMock } = require('../utils/mockFlag');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const { slugify } = require('../utils/slugify');
const { parsePagination, buildPaginated } = require('../utils/pagination');

async function listProducts(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const where = { storeId };
    if (query.status) where.status = Array.isArray(query.status) ? { [Op.in]: query.status } : query.status;
    if (query.productType) where.productType = query.productType;
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured === 'true';
    if (query.search) where[Op.or] = [{ name: { [Op.iLike]: `%${query.search}%` } }, { sku: { [Op.iLike]: `%${query.search}%` } }];
    const { rows, count } = await CommerceProduct.findAndCountAll({
        where, limit, offset, order: [['updatedAt', 'DESC']],
        include: [{ model: CommerceProductVariant, as: 'variants', limit: 1, order: [['isDefault', 'DESC']] }],
        attributes: { exclude: ['description'] },
    });
    return buildPaginated(rows, count, { page, limit });
}

async function getProduct(storeId, productId) {
    const cached = await cache.get(cache.keys.product(productId));
    if (cached && cached.storeId === storeId) return cached;
    const product = await CommerceProduct.findOne({
        where: { id: productId, storeId },
        include: [
            { model: CommerceProductVariant, as: 'variants', order: [['sortOrder', 'ASC']] },
            { model: CommerceProductPricing, as: 'pricing' },
            { model: CommerceProductMedia, as: 'media', order: [['sortOrder', 'ASC']] },
            { model: CommerceCategory, as: 'category', attributes: ['id', 'name', 'slug'] },
        ],
    });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    const data = product.toJSON();
    await cache.set(cache.keys.product(productId), data, config.cache.productTtl);
    return data;
}

async function createProduct(storeId, userId, body) {
    const slug = body.slug || slugify(body.name);
    const existing = await CommerceProduct.findOne({ where: { storeId, slug } });
    if (existing) throw new AppError('CONFLICT', 'Product slug already exists in this store', 409);

    const product = await sequelize.transaction(async (t) => {
        const p = await CommerceProduct.create({
            ...body, storeId, slug, createdBy: userId, lastEditedBy: userId, status: 'draft', viewCount: 0, revisionCount: 0,
        }, { transaction: t });

        if (p.productType === 'simple') {
            const variantSku = body.sku || `${slug.toUpperCase().slice(0, 10)}-DEFAULT`;
            await CommerceProductVariant.create({
                productId: p.id, sku: variantSku, isDefault: true, isActive: true,
                price: body.price || 0, currencyCode: body.currencyCode || 'USD', sortOrder: 0,
            }, { transaction: t });
        }
        return p;
    });
    return product.toJSON();
}

async function updateProduct(storeId, productId, userId, body) {
    const product = await CommerceProduct.findOne({ where: { id: productId, storeId } });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    if (body.slug && body.slug !== product.slug) {
        const existing = await CommerceProduct.findOne({ where: { storeId, slug: body.slug, id: { [Op.ne]: productId } } });
        if (existing) throw new AppError('CONFLICT', 'Product slug already exists', 409);
    }
    await product.update({ ...body, lastEditedBy: userId });
    // An operator editing real details curates a mock filler into a real listing — clear its mock
    // markers so the cleanup script never removes it.
    await demoteFromMock(product);
    await cache.del(cache.keys.product(productId));
    return product.toJSON();
}

async function deleteProduct(storeId, productId) {
    const product = await CommerceProduct.findOne({ where: { id: productId, storeId } });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    if (product.status === 'published') throw new AppError('FORBIDDEN', 'Cannot delete a published product. Archive it first.', 403);
    await product.destroy();
    await cache.del(cache.keys.product(productId));
}

// Seller-facing "Publish" now SUBMITS the listing for admin moderation rather than making it
// public directly — Market Underworld now shares one catalog across many independent, mutually-
// untrusting sellers (see sellerApplicationService.js), so a seller self-publishing straight to
// the live storefront with zero review is no longer acceptable. Actual public visibility is
// granted only by moderateProduct() below. 'rejected' listings resubmit through this same path.
async function publishProduct(storeId, productId, userId) {
    const product = await CommerceProduct.findOne({ where: { id: productId, storeId } });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    if (!['draft', 'rejected'].includes(product.status)) throw new AppError('CONFLICT', 'Product must be a draft (or rejected listing) to submit for review', 409);
    await product.update({ status: 'pending_review', lastEditedBy: userId });
    await cache.del(cache.keys.product(productId));
    return product.toJSON();
}

// Admin moderation decision on a pending_review listing. Approve makes it live (published,
// visible on the public storefront per storefrontService's PUBLIC_WHERE filter); reject sends it
// back to the seller as 'rejected' (editable + resubmittable) with a reason recorded so they know
// what to fix — never silently deleted.
async function moderateProduct(storeId, productId, adminUserId, { action, reason }) {
    const product = await CommerceProduct.findOne({ where: { id: productId, storeId } });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    if (product.status !== 'pending_review') throw new AppError('CONFLICT', 'Product is not awaiting review', 409);
    if (action === 'approve') {
        await product.update({ status: 'published', publishedAt: new Date(), lastEditedBy: adminUserId });
    } else {
        await product.update({
            status: 'rejected',
            lastEditedBy: adminUserId,
            customFields: { ...(product.customFields || {}), moderationRejectionReason: reason || null, moderationRejectedAt: new Date().toISOString() },
        });
    }
    await cache.del(cache.keys.product(productId));
    return product.toJSON();
}

// Cross-store queue for the admin moderation console — mirrors listProductsAcrossStores exactly,
// filtered to pending_review only.
async function listPendingModeration({ page: pageIn, limit: limitIn } = {}) {
    const { page, limit, offset } = parsePagination({ page: pageIn, limit: limitIn });
    const { rows, count } = await CommerceProduct.findAndCountAll({
        where: { status: 'pending_review' },
        include: [{ model: CommerceStore, as: 'store', attributes: ['id', 'name', 'countryCode'] }],
        order: [['updatedAt', 'ASC']], // oldest submission first — first in, first reviewed
        attributes: { exclude: ['description'] },
        limit, offset,
    });
    return buildPaginated(rows.map((r) => r.toJSON()), count, { page, limit });
}

async function duplicateProduct(storeId, productId, userId) {
    const original = await getProduct(storeId, productId);
    const newSlug = `${original.slug}-copy-${Date.now()}`;
    const { id, createdAt, updatedAt, variants, pricing, media, ...rest } = original;
    const newProduct = await sequelize.transaction(async (t) => {
        const p = await CommerceProduct.create({
            ...rest, storeId, slug: newSlug, name: `${original.name} (Copy)`,
            status: 'draft', publishedAt: null, viewCount: 0, revisionCount: 0,
            createdBy: userId, lastEditedBy: userId,
        }, { transaction: t });
        if (variants?.length) {
            for (const v of variants) {
                const { id: vid, productId: _, createdAt: vc, updatedAt: vu, ...vRest } = v;
                await CommerceProductVariant.create({ ...vRest, productId: p.id, sku: `${v.sku}-COPY-${Date.now()}` }, { transaction: t });
            }
        }
        return p;
    });
    return newProduct.toJSON();
}

async function bulkUpdate(storeId, userId, { ids, action, categoryId }) {
    const products = await CommerceProduct.findAll({ where: { id: { [Op.in]: ids }, storeId } });
    if (!products.length) throw new AppError('NOT_FOUND', 'No products found', 404);
    switch (action) {
        case 'publish': await CommerceProduct.update({ status: 'published', publishedAt: new Date(), lastEditedBy: userId }, { where: { id: { [Op.in]: ids }, storeId } }); break;
        case 'archive': await CommerceProduct.update({ status: 'archived', lastEditedBy: userId }, { where: { id: { [Op.in]: ids }, storeId } }); break;
        case 'delete': {
            const pub = products.filter(p => p.status === 'published');
            if (pub.length) throw new AppError('FORBIDDEN', 'Cannot delete published products', 403);
            await CommerceProduct.destroy({ where: { id: { [Op.in]: ids }, storeId } }); break;
        }
        case 'assign_category':
            if (!categoryId) throw new AppError('VALIDATION_ERROR', 'categoryId required', 400);
            await CommerceProduct.update({ categoryId, lastEditedBy: userId }, { where: { id: { [Op.in]: ids }, storeId } }); break;
        default: throw new AppError('VALIDATION_ERROR', `Unknown action: ${action}`, 400);
    }
    await Promise.all(ids.map(id => cache.del(cache.keys.product(id))));
    return { updated: products.length };
}

// Cross-store admin view — mirrors categoryService.listCategoriesAcrossStores exactly (same
// admin-list convention, same CommerceStore include for the store name/country column).
async function listProductsAcrossStores({ storeId, search, status, page: pageIn, limit: limitIn } = {}) {
    const { page, limit, offset } = parsePagination({ page: pageIn, limit: limitIn });
    const where = {};
    if (storeId) where.storeId = storeId;
    if (status) where.status = Array.isArray(status) ? { [Op.in]: status } : status;
    if (search) where[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { sku: { [Op.iLike]: `%${search}%` } }];
    const { rows, count } = await CommerceProduct.findAndCountAll({
        where,
        include: [{ model: CommerceStore, as: 'store', attributes: ['id', 'name', 'countryCode'] }],
        order: [['updatedAt', 'DESC']],
        attributes: { exclude: ['description'] },
        limit, offset,
    });
    return buildPaginated(rows.map((r) => r.toJSON()), count, { page, limit });
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, publishProduct, duplicateProduct, bulkUpdate, listProductsAcrossStores, moderateProduct, listPendingModeration };
