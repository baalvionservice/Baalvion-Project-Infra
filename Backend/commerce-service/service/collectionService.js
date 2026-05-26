'use strict';
const { CommerceCollection, CommerceCollectionProduct, CommerceProduct } = require('../models');
const { AppError } = require('../utils/errors');
const cache = require('./cacheService');
const config = require('../config/appConfig');
const { slugify } = require('../utils/slugify');
const { parsePagination, buildPaginated } = require('../utils/pagination');

async function listCollections(storeId, query = {}) {
    const { page, limit, offset } = parsePagination(query);
    const { rows, count } = await CommerceCollection.findAndCountAll({ where: { storeId }, limit, offset, order: [['sortOrder', 'ASC']] });
    return buildPaginated(rows, count, { page, limit });
}

async function getCollection(storeId, collectionId) {
    const col = await CommerceCollection.findOne({ where: { id: collectionId, storeId } });
    if (!col) throw new AppError('NOT_FOUND', 'Collection not found', 404);
    return col.toJSON();
}

async function createCollection(storeId, body) {
    const slug = body.slug || slugify(body.name);
    const existing = await CommerceCollection.findOne({ where: { storeId, slug } });
    if (existing) throw new AppError('CONFLICT', 'Collection slug already exists', 409);
    const col = await CommerceCollection.create({ ...body, storeId, slug });
    await cache.del(cache.keys.collectionList(storeId));
    return col.toJSON();
}

async function updateCollection(storeId, collectionId, body) {
    const col = await CommerceCollection.findOne({ where: { id: collectionId, storeId } });
    if (!col) throw new AppError('NOT_FOUND', 'Collection not found', 404);
    await col.update(body);
    await cache.del(cache.keys.collectionList(storeId));
    return col.toJSON();
}

async function deleteCollection(storeId, collectionId) {
    const col = await CommerceCollection.findOne({ where: { id: collectionId, storeId } });
    if (!col) throw new AppError('NOT_FOUND', 'Collection not found', 404);
    await col.destroy();
    await cache.del(cache.keys.collectionList(storeId));
}

async function addProduct(storeId, collectionId, productId) {
    const col = await CommerceCollection.findOne({ where: { id: collectionId, storeId } });
    if (!col) throw new AppError('NOT_FOUND', 'Collection not found', 404);
    const product = await CommerceProduct.findOne({ where: { id: productId, storeId } });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    await CommerceCollectionProduct.findOrCreate({ where: { collectionId, productId }, defaults: { collectionId, productId } });
    await col.increment('productCount');
    return { collectionId, productId };
}

async function removeProduct(storeId, collectionId, productId) {
    const col = await CommerceCollection.findOne({ where: { id: collectionId, storeId } });
    if (!col) throw new AppError('NOT_FOUND', 'Collection not found', 404);
    const deleted = await CommerceCollectionProduct.destroy({ where: { collectionId, productId } });
    if (deleted && col.productCount > 0) await col.decrement('productCount');
}

module.exports = { listCollections, getCollection, createCollection, updateCollection, deleteCollection, addProduct, removeProduct };
