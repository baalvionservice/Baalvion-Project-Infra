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
    // Explicit cross-store isolation boundary (mirrors listVariants/createVariant): never
    // create or mutate pricing for a product that does not belong to the addressed store.
    const product = await CommerceProduct.findOne({ where: { id: productId, storeId } });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    const [pricing, created] = await CommerceProductPricing.findOrCreate({
        where: { productId, variantId: variantId || null, storeId },
        defaults: { ...body, productId, variantId: variantId || null, storeId },
    });
    if (!created) await pricing.update(body);

    // The price a buyer sees and is charged lives on the variant (the storefront and order-service
    // read variant.price; a product-level pricing row is never consulted). So an ordinary price (no
    // schedule) is written there too, otherwise a listing priced from the seller screen shows 0.
    const scheduled = !!(body.startsAt || body.endsAt);
    if (!scheduled && body.isActive !== false && body.price !== undefined) {
        const target = variantId
            ? { id: variantId, productId }
            : { productId, isDefault: true };
        const patch = { price: body.price, currencyCode: body.currencyCode };
        if (body.compareAtPrice !== undefined) patch.compareAtPrice = body.compareAtPrice;
        await CommerceProductVariant.update(patch, { where: target });
    }
    await cache.del(cache.keys.product(productId));
    return pricing.toJSON();
}

module.exports = { listVariants, createVariant, updateVariant, deleteVariant, upsertPricing };
