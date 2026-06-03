'use strict';
// Public storefront read API — anonymous access to PUBLISHED + PUBLIC catalog only.
// Distinct from the authed admin product/category/collection services. No writes here.
//
// Multi-market: an optional `?country=` (us|uk|ae|in|sg) (a) filters the catalog to
// products available in that market (regions/isGlobal), and (b) makes the serializer
// return the market's converted price + currency + tax. Unknown/absent country falls
// back to base (USD) behavior so existing callers are unaffected.
const { Op, literal } = require('sequelize');
const {
    CommerceStore, CommerceProduct, CommerceProductVariant, CommerceProductPricing,
    CommerceProductMedia, CommerceCategory, CommerceCollection,
} = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination } = require('../utils/pagination');
const serializer = require('../utils/storefrontSerializer');
const { isSupportedMarket } = require('../config/markets');

const PUBLIC_WHERE = { status: 'published', visibility: 'public' };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Resolve a validated market code, or null when none is supplied. A PRESENT-but-invalid
// country is an explicit client error (400) rather than a silently-unfiltered request.
// Validation against the fixed allowlist also makes the value safe to interpolate into
// the JSONB region filter below.
function resolveCountry(query = {}) {
    const c = typeof query.country === 'string' ? query.country.trim().toLowerCase() : '';
    if (!c) return null;
    if (!isSupportedMarket(c)) {
        throw new AppError('BAD_REQUEST', `Unsupported country: ${c}`, 400);
    }
    return c;
}

// Postgres JSONB availability predicate: global OR region-less OR regions contains country.
// `country` is pre-validated to the allowlist, so the embedded literal is injection-safe.
function regionWhere(country) {
    const arr = JSON.stringify([country]); // e.g. ["us"]
    return literal(
        `(COALESCE((custom_fields->>'isGlobal')::boolean, false) = true`
        + ` OR custom_fields->'regions' @> '${arr}'::jsonb`
        + ` OR COALESCE(jsonb_array_length(custom_fields->'regions'), 0) = 0)`
    );
}

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
    const country = resolveCountry(query);
    const { page, limit, offset } = parsePagination(query, 200);
    const where = { storeId, ...PUBLIC_WHERE };

    if (query.categoryId) {
        const cat = await CommerceCategory.findOne({ where: { storeId, slug: query.categoryId }, attributes: ['id'] });
        where.categoryId = cat ? cat.id : '00000000-0000-0000-0000-000000000000';
    }
    if (query.isFeatured !== undefined) where.isFeatured = String(query.isFeatured) === 'true';
    if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };

    // Server-side per-market availability filter (real backend filtering, not advisory).
    if (country) where[Op.and] = [...(where[Op.and] || []), regionWhere(country)];

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
        items: rows.map((r) => serializer.serializeProductListItem(r.toJSON(), { country })),
        total: count,
        page,
        pageSize: limit,
        totalPages: Math.max(1, Math.ceil(count / limit)),
    };
}

async function getProduct(storeId, idOrSlug, query = {}) {
    await ensureStore(storeId);
    const country = resolveCountry(query);
    const idClause = UUID_RE.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
    const product = await CommerceProduct.findOne({
        where: { storeId, ...PUBLIC_WHERE, ...idClause },
        include: [...baseIncludes(), { model: CommerceProductPricing, as: 'pricing' }],
    });
    if (!product) throw new AppError('NOT_FOUND', 'Product not found', 404);
    const json = product.toJSON();
    // Out-of-market artifact → 404 in this country so the storefront page renders not-found.
    if (country && !serializer.isAvailableInCountry(json, country)) {
        throw new AppError('NOT_FOUND', 'Product not found', 404);
    }
    return serializer.serializeProductDetail(json, { country });
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
