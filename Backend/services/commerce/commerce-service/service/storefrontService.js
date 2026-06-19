'use strict';
// Public storefront read API — anonymous access to PUBLISHED + PUBLIC catalog only.
// Distinct from the authed admin product/category/collection services. No writes here.
//
// Multi-market: an optional `?country=` (us|uk|ae|in|sg) (a) filters the catalog to
// products available in that market (regions/isGlobal), and (b) makes the serializer
// return the market's converted price + currency + tax. Unknown/absent country falls
// back to base (USD) behavior so existing callers are unaffected.
const { Op, literal, QueryTypes } = require('sequelize');
const {
    sequelize,
    CommerceStore, CommerceProduct, CommerceProductVariant, CommerceProductPricing,
    CommerceProductMedia, CommerceCategory, CommerceCollection,
} = require('../models');
const { AppError } = require('../utils/errors');
const { parsePagination } = require('../utils/pagination');
const serializer = require('../utils/storefrontSerializer');
const filters = require('../utils/storefrontFilters');
const { isSupportedMarket } = require('../config/markets');
const discountService = require('./discountService');

const PUBLIC_WHERE = { status: 'published', visibility: 'public' };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Keyword-search target columns. ILIKE across name + sku + brand (custom_fields->>'brandId') +
// description + tags. brand/tags need raw fragments because brand lives in JSONB and tags is a
// text[] (matched with array_to_string). Built with sequelize.escape so the term is injection-safe.
// Case-insensitive; the term is wrapped in %…% with LIKE metacharacters escaped so a user-supplied
// %/_ matches literally rather than acting as a wildcard.
function escapeLike(term) {
    return term.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}
function searchClause(rawTerm, { Op, literal }) {
    const term = typeof rawTerm === 'string' ? rawTerm.trim() : '';
    if (!term) return null;
    const like = `%${escapeLike(term)}%`;
    const safe = sequelize.escape(like); // fully-quoted SQL string literal
    return {
        [Op.or]: [
            { name: { [Op.iLike]: like } },
            { sku: { [Op.iLike]: like } },
            { description: { [Op.iLike]: like } },
            // brand (JSONB scalar) and tags (text[]) — raw, value bound via sequelize.escape.
            literal(`(custom_fields->>'brandId') ILIKE ${safe}`),
            literal(`array_to_string(tags, ' ') ILIKE ${safe}`),
        ],
    };
}

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
    // regionWhere() deliberately repeats this allowlist check as SQL-interpolation defense-in-depth
    // (it interpolates `country` into raw SQL), so an un-validated future call path can't open a hole.
    return c;
}

// Postgres JSONB availability predicate: global OR region-less OR regions contains country.
// `country` is pre-validated to the allowlist, so the embedded literal is injection-safe.
function regionWhere(country) {
    // Defense-in-depth: this function interpolates `country` into raw SQL. Never trust a caller
    // to have validated it — assert the allowlist invariant here so a future un-validated call
    // path fails loudly instead of opening an injection hole.
    if (!isSupportedMarket(country)) {
        throw new AppError('BAD_REQUEST', `Unsupported country: ${country}`, 400);
    }
    const arr = JSON.stringify([country]); // e.g. ["us"]
    // Let Sequelize's dialect escaper own the quoting of the value instead of
    // concatenating it raw into SQL. sequelize.escape() returns a fully-quoted,
    // injection-safe SQL string literal (equivalent to a bound parameter here),
    // so the JSONB region value can never break out of its quotes.
    const arrLiteral = sequelize.escape(arr);
    return literal(
        `(COALESCE((custom_fields->>'isGlobal')::boolean, false) = true`
        + ` OR custom_fields->'regions' @> ${arrLiteral}::jsonb`
        + ` OR COALESCE(jsonb_array_length(custom_fields->'regions'), 0) = 0)`
    );
}

const baseIncludes = () => ([
    { model: CommerceProductVariant, as: 'variants', separate: true, order: [['sortOrder', 'ASC']] },
    { model: CommerceProductMedia, as: 'media', separate: true, order: [['sortOrder', 'ASC']] },
    { model: CommerceCollection, as: 'collections', through: { attributes: [] }, attributes: ['id', 'slug', 'name'] },
    {
        model: CommerceCategory, as: 'category', attributes: ['id', 'slug', 'name', 'parentId'],
        // Parent = department/brand (root category). Surfaced so the serializer can emit a real
        // departmentId/department for the storefront brand tabs + department pages.
        include: [{ model: CommerceCategory, as: 'parent', attributes: ['id', 'slug', 'name'] }],
    },
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
    const and = [];

    // categoryId is a slug → resolve to the real category UUID once; reused by the count queries.
    let categoryId = null;
    if (query.categoryId) {
        const cat = await CommerceCategory.findOne({ where: { storeId, slug: query.categoryId }, attributes: ['id'] });
        categoryId = cat ? cat.id : '00000000-0000-0000-0000-000000000000';
        where.categoryId = categoryId;
    }
    if (query.isFeatured !== undefined) where.isFeatured = String(query.isFeatured) === 'true';

    // (1) Real keyword search: ILIKE across name + sku + brand + description + tags (was name-only).
    const search = searchClause(query.search ?? query.q, { Op, literal });
    if (search) and.push(search);

    // (2) Faceted filters (brand/color/size/condition/price). OR within a facet, AND across facets.
    const selection = filters.parseFacetFilters(query);
    const deps = { Op, literal, escape: (v) => sequelize.escape(v) };
    const facetWhere = filters.buildFacetWhere(selection, deps);
    if (facetWhere.clause) Object.assign(where, facetWhere.clause); // condition Op.in (real column)
    and.push(...facetWhere.and);

    // Server-side per-market availability filter (real backend filtering, not advisory).
    if (country) and.push(regionWhere(country));
    if (and.length) where[Op.and] = and;

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

    // (3) Facet counts: one grouped aggregate per dimension + one price MIN/MAX. Each dimension is
    // counted with the OTHER active facets applied but its OWN selection excluded (mutual-exclusion
    // faceting) so selecting a value never collapses that facet's option list.
    const facets = await computeFacets(selection, { storeId, categoryId });

    return {
        // Backward-compatible legacy shape (items/total/page/pageSize/totalPages) + the new facets.
        items: rows.map((r) => serializer.serializeProductListItem(r.toJSON(), { country })),
        total: count,
        page,
        pageSize: limit,
        totalPages: Math.max(1, Math.ceil(count / limit)),
        facets,
    };
}

// Compute the `facets` object. Strategy: ONE grouped COUNT(*) query per facet dimension (brand,
// color, size, condition) + ONE MIN/MAX price query — 5 single-pass aggregates total, NO N+1 and
// NO per-product looping. Each dimension query excludes its own selection (so the facet shows all
// options, not just the chosen one) but applies every other active filter.
//
// Documented simplification: facet counts are scoped to the storeId + public/published catalog +
// scalar (categoryId) + facet filters. They deliberately do NOT re-apply the per-market region
// filter or the collection join — those affect the product LIST only. This keeps each facet to a
// single grouped pass; counts therefore reflect the catalog-wide facet filter set, which is the
// standard, predictable behaviour for a faceted filter sidebar.
async function computeFacets(selection, base) {
    const run = async (sql, binds) =>
        sequelize.query(sql, { bind: binds, type: QueryTypes.SELECT });

    const [brandRows, colorRows, sizeRows, conditionRows, priceRows] = await Promise.all([
        (() => { const { sql, binds } = filters.buildDimensionCountQuery('brand', selection, base); return run(sql, binds); })(),
        (() => { const { sql, binds } = filters.buildDimensionCountQuery('color', selection, base); return run(sql, binds); })(),
        (() => { const { sql, binds } = filters.buildDimensionCountQuery('size', selection, base); return run(sql, binds); })(),
        (() => { const { sql, binds } = filters.buildDimensionCountQuery('condition', selection, base); return run(sql, binds); })(),
        (() => { const { sql, binds } = filters.buildPriceRangeQuery(selection, base); return run(sql, binds); })(),
    ]);

    return filters.shapeFacets({
        brand: filters.shapeBuckets(brandRows),
        color: filters.shapeBuckets(colorRows),
        size: filters.shapeBuckets(sizeRows),
        condition: filters.shapeBuckets(conditionRows),
        priceRange: filters.shapePriceRange(priceRows && priceRows[0]),
    });
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

// Catalog-based related-products recommendations (replaces the dead mock). Builds an ordered,
// de-duped candidate list — curated relations first, then same-collection members, then same
// category, then featured-newest backfill — all constrained to the PUBLIC published catalog and
// the optional per-market availability filter. Honest: it only ever returns real, in-market,
// published products other than the source product, capped at `limit` (default 8, max 24).
async function listRelated(storeId, idOrSlug, query = {}) {
    await ensureStore(storeId);
    const country = resolveCountry(query);
    const limit = Math.min(24, Math.max(1, parseInt(query.limit, 10) || 8));

    const idClause = UUID_RE.test(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
    const source = await CommerceProduct.findOne({
        where: { storeId, ...PUBLIC_WHERE, ...idClause },
        include: [{ model: CommerceCollection, as: 'collections', through: { attributes: [] }, attributes: ['id'] }],
    });
    if (!source) throw new AppError('NOT_FOUND', 'Product not found', 404);

    // Common WHERE for every candidate query: same store, public/published, exclude self, in-market.
    const baseWhere = () => {
        const where = { storeId, ...PUBLIC_WHERE, id: { [Op.ne]: source.id } };
        if (country) where[Op.and] = [...(where[Op.and] || []), regionWhere(country)];
        return where;
    };

    const picked = new Map(); // id -> product instance, preserves first-seen ordering
    const take = (rows) => {
        for (const r of rows) {
            if (picked.size >= limit) break;
            if (!picked.has(r.id) && r.id !== source.id) picked.set(r.id, r);
        }
    };
    const remaining = () => limit - picked.size;

    // (1) Curated related_product_ids, in declared order.
    const curatedIds = Array.isArray(source.relatedProductIds) ? source.relatedProductIds.filter((x) => x && x !== source.id) : [];
    if (curatedIds.length) {
        const rows = await CommerceProduct.findAll({
            where: { ...baseWhere(), id: { [Op.in]: curatedIds } },
            include: baseIncludes(),
        });
        const byId = new Map(rows.map((r) => [r.id, r]));
        take(curatedIds.map((id) => byId.get(id)).filter(Boolean));
    }

    // (2) Same-collection members.
    const collectionIds = (source.collections || []).map((c) => c.id);
    if (remaining() > 0 && collectionIds.length) {
        const includes = baseIncludes();
        const col = includes.find((i) => i.as === 'collections');
        col.required = true;
        col.where = { id: { [Op.in]: collectionIds } };
        const rows = await CommerceProduct.findAll({
            where: { ...baseWhere(), id: { [Op.notIn]: [source.id, ...picked.keys()] } },
            include: includes, order: [['created_at', 'DESC']], limit: remaining(), subQuery: false, distinct: true,
        });
        take(rows);
    }

    // (3) Same category.
    if (remaining() > 0 && source.categoryId) {
        const rows = await CommerceProduct.findAll({
            where: { ...baseWhere(), categoryId: source.categoryId, id: { [Op.notIn]: [source.id, ...picked.keys()] } },
            include: baseIncludes(), order: [['created_at', 'DESC']], limit: remaining(),
        });
        take(rows);
    }

    // (4) Backfill with featured, newest first.
    if (remaining() > 0) {
        const rows = await CommerceProduct.findAll({
            where: { ...baseWhere(), isFeatured: true, id: { [Op.notIn]: [source.id, ...picked.keys()] } },
            include: baseIncludes(), order: [['created_at', 'DESC']], limit: remaining(),
        });
        take(rows);
    }

    return Array.from(picked.values())
        .slice(0, limit)
        .map((r) => serializer.serializeProductListItem(r.toJSON(), { country }));
}

// Anonymous storefront discount PREVIEW — lets a shopper check a promo code before order creation
// WITHOUT exposing admin-only discount internals (id, name, targetIds, usageCount/limit, dates).
// Validity, eligibility (min-purchase / usage-limit) and the computed amount are server-authoritative
// (delegated to discountService.validateDiscount — the same logic order-service applies); this only
// projects a non-leaky envelope. Final application stays server-authoritative at order creation.
async function previewDiscount(storeId, { code, orderAmount = 0 }) {
    await ensureStore(storeId);
    const amount = Number(orderAmount);
    const safeAmount = Number.isFinite(amount) && amount >= 0 ? amount : 0;
    const { discount, discountAmount } = await discountService.validateDiscount(storeId, code, safeAmount);
    // Non-leaky projection: only the fields a storefront needs to render the promo line.
    return {
        valid: true,
        code: discount.code,
        type: discount.type,
        amount: Math.round(discountAmount * 100) / 100,
        eligibility: {
            minPurchaseAmount: discount.minPurchaseAmount != null ? Number(discount.minPurchaseAmount) : null,
            appliesTo: discount.appliesTo || 'all',
        },
    };
}

module.exports = { listProducts, getProduct, listDepartments, listCategories, listCollections, listRelated, previewDiscount };
