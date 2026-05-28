'use strict';
const { CommerceProduct, CommerceProductVariant, CommerceProductPricing } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');

async function listVariants(storeId, productId) {
    const product = await CommerceProduct.findOne({ where: { id: productId, storeId } });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    return CommerceProductVariant.findAll({ where: { productId }, order: [['sortOrder', 'ASC']] });
}

async function createVariant(storeId, productId, body) {
    const product = await CommerceProduct.findOne({ where: { id: productId, storeId } });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    const existing = await CommerceProductVariant.findOne({ where: { sku: body.sku } });
    if (existing) throw new AppError('CONFLICT', 'SKU already exists', 409);
    const variant = await CommerceProductVariant.create({ ...body, productId });
    await cache.del(cache.keys.product(productId));
    return variant.toJSON();
}

async function updateVariant(storeId, productId, variantId, body) {
    const product = await CommerceProduct.findOne({ where: { id: productId, storeId } });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    const variant = await CommerceProductVariant.findOne({ where: { id: variantId, productId } });
    if (!variant) throw new AppError('NOT_FOUND', 'Variant not found', 404);
    if (body.sku && body.sku !== variant.sku) {
        const skuExists = await CommerceProductVariant.findOne({ where: { sku: body.sku } });
        if (skuExists) throw new AppError('CONFLICT', 'SKU already exists', 409);
    }
    await variant.update(body);
    await cache.del(cache.keys.product(productId));
    return variant.toJSON();
}

async function deleteVariant(storeId, productId, variantId) {
    const variant = await CommerceProductVariant.findOne({ where: { id: variantId, productId } });
    if (!variant) throw new AppError('NOT_FOUND', 'Variant not found', 404);
    if (variant.isDefault) throw new AppError('FORBIDDEN', 'Cannot delete the default variant', 403);
    await variant.destroy();
    await cache.del(cache.keys.product(productId));
}

async function upsertPricing(storeId, productId, variantId, body) {
    const [pricing, created] = await CommerceProductPricing.findOrCreate({
        where: { productId, variantId: variantId || null, storeId },
        defaults: { ...body, productId, variantId: variantId || null, storeId },
    });
    if (!created) await pricing.update(body);
    await cache.del(cache.keys.product(productId));
    return pricing.toJSON();
}

module.exports = { listVariants, createVariant, updateVariant, deleteVariant, upsertPricing };
