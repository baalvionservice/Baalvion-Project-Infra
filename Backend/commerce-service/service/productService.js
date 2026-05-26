'use strict';
const { Op } = require('sequelize');
const { CommerceProduct, CommerceProductVariant, CommerceProductPricing, CommerceProductMedia, CommerceCategory, sequelize } = require('../models');
const { AppError } = require('../utils/errors');
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

async function publishProduct(storeId, productId, userId) {
    const product = await CommerceProduct.findOne({ where: { id: productId, storeId } });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    if (!['approved', 'draft'].includes(product.status)) throw new AppError('CONFLICT', 'Product must be approved or draft to publish', 409);
    await product.update({ status: 'published', publishedAt: new Date(), lastEditedBy: userId });
    await cache.del(cache.keys.product(productId));
    return product.toJSON();
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

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, publishProduct, duplicateProduct, bulkUpdate };
