'use strict';
// Public storefront read API — anonymous access to PUBLISHED + PUBLIC catalog only.
// Distinct from the authed admin product/category/collection services. No writes here.
const { Op } = require('sequelize');
const {
    CommerceStore, CommerceProduct, CommerceProductVariant, CommerceProductPricing,
    CommerceProductMedia, CommerceCategory, CommerceCollection,
} = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination } = require('../utils/pagination');
const serializer = require('../utils/storefrontSerializer');

const PUBLIC_WHERE = { status: 'published', visibility: 'public' };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const baseIncludes = () => ([
    { model: CommerceProductVariant, as: 'variants', separate: true, order: [['sortOrder', 'ASC']] },
    { model: CommerceProductMedia, as: 'media', separate: true, order: [['sortOrder', 'ASC']] },
    { model: CommerceCollection, as: 'collections', through: { attributes: [] }, attributes: ['id', 'slug', 'name'] },
    { model: CommerceCategory, as: 'category', attributes: ['id', 'slug', 'name'] },
]);

async function ensureStore(storeId) {
    const store = await CommerceStore.findByPk(storeId);
    if (!store) throw new AppError('NOT_FOUND', 'Store not found', 404);
    return store;
}

async function listProducts(storeId, query = {}) {
    await ensureStore(storeId);
    const { page, limit, offset } = parsePagination(query, 200);
    const where = { storeId, ...PUBLIC_WHERE };

    if (query.categoryId) {
        const cat = await CommerceCategory.findOne({ where: { storeId, slug: query.categoryId }, attributes: ['id'] });
        where.categoryId = cat ? cat.id : '00000000-0000-0000-0000-000000000000';
    }
    if (query.isFeatured !== undefined) where.isFeatured = String(query.isFeatured) === 'true';
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };

    const includes = baseIncludes();
    if (query.collectionId) {
        const col = includes.find((i) => i.as === 'collections');
        col.required = true;
        col.where = { slug: query.collectionId };
    }

    const { rows, count } = await CommerceProduct.findAndCountAll({
        where, limit, offset, order: [['created_at', 'DESC']],
        include: includes, distinct: true,
    });

    return {
        items: rows.map((r) => serializer.serializeProductListItem(r.toJSON())),
        total: count,
        page,
        pageSize: limit,
        totalPages: Math.max(1, Math.ceil(count / limit)),
    };
}

async function getProduct(storeId, idOrSlug) {
    await ensureStore(storeId);
    const idClause = UUID_RE.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
    const product = await CommerceProduct.findOne({
        where: { storeId, ...PUBLIC_WHERE, ...idClause },
        include: [...baseIncludes(), { model: CommerceProductPricing, as: 'pricing' }],
    });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    return serializer.serializeProductDetail(product.toJSON());
}

async function listDepartments(storeId) {
    await ensureStore(storeId);
    const cats = await CommerceCategory.findAll({ where: { storeId, isActive: true }, order: [['sortOrder', 'ASC']] });
    return serializer.serializeDepartments(cats.map((c) => c.toJSON()));
}

async function listCategories(storeId) {
    await ensureStore(storeId);
    const cats = await CommerceCategory.findAll({ where: { storeId, isActive: true }, order: [['sortOrder', 'ASC']] });
    return serializer.serializeCategories(cats.map((c) => c.toJSON()));
}

async function listCollections(storeId) {
    await ensureStore(storeId);
    const cols = await CommerceCollection.findAll({ where: { storeId, isActive: true }, order: [['sortOrder', 'ASC']] });
    return cols.map((c) => serializer.serializeCollection(c.toJSON()));
}

module.exports = { listProducts, getProduct, listDepartments, listCategories, listCollections };
