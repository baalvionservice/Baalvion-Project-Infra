'use strict';
// storefrontService.listProducts — keyword search + faceted filtering + facet counts, wired
// through STUBBED Sequelize statics (no DB, mirrors reviewAggregate.test.js / markets.test.js).
// Verifies: (a) the response stays backward-compatible (items/total/page/pageSize/totalPages) and
// gains a `facets` object; (b) the WHERE handed to findAndCountAll carries the search OR-group +
// the facet predicates; (c) facet counts are produced from one grouped query per dimension with the
// dimension's own selection EXCLUDED; (d) facets shape matches the documented contract.
process.env.FX_LIVE_FEED = 'false';

const { test, beforeEach } = require('node:test');
const assert = require('node:assert');
const { Op } = require('sequelize');

require('./_env'); // dummy JWT_PUBLIC_KEY so the fail-loud config boots under CI (no .env)
const models = require('../models');
const storefront = require('../service/storefrontService');

const STORE = 'store-1';

// Capture the last WHERE / order passed to findAndCountAll, and record every raw facet query.
let lastFindArgs = null;
let rawQueries = [];

beforeEach(() => {
    lastFindArgs = null;
    rawQueries = [];

    models.CommerceStore.findByPk = async (id) => (id === STORE ? { id: STORE } : null);
    models.CommerceCategory.findOne = async ({ where }) =>
        where.slug === 'handbags' ? { id: 'cat-handbags' } : null;

    models.CommerceProduct.findAndCountAll = async (args) => {
        lastFindArgs = args;
        // One representative published product row (toJSON shape the serializer expects).
        const row = {
            toJSON: () => ({
                id: 'p1', name: 'Hermès Birkin 25', slug: 'hermes-birkin-25',
                status: 'published', visibility: 'public',
                customFields: { basePrice: 12000, brandId: 'hermes', colors: ['black'], sizes: ['25'] },
                variants: [{ isDefault: true, price: 12000 }], media: [], collections: [],
                category: null, condition: 'pristine',
            }),
        };
        return { rows: [row], count: 1 };
    };

    // Stub the raw facet-count path. Return a deterministic grouped result per dimension based on
    // which SELECT expression the query uses, so we can assert the shaping + per-dimension wiring.
    const sequelize = models.sequelize;
    sequelize.escape = (v) => `'${String(v).replace(/'/g, "''")}'`;
    sequelize.query = async (sql) => {
        rawQueries.push(sql);
        if (sql.includes("GROUP BY p.custom_fields->>'brandId'")) {
            return [{ value: 'hermes', count: 3 }, { value: 'chanel', count: 1 }];
        }
        if (sql.includes("jsonb_array_elements_text(p.custom_fields->'colors')")) {
            return [{ value: 'black', count: 2 }, { value: 'tan', count: 2 }];
        }
        if (sql.includes("jsonb_array_elements_text(p.custom_fields->'sizes')")) {
            return [{ value: '25', count: 4 }];
        }
        if (sql.includes('GROUP BY p.condition')) {
            return [{ value: 'pristine', count: 4 }, { value: null, count: 9 }];
        }
        if (sql.includes('MIN(COALESCE')) {
            return [{ min: '500', max: '12000' }];
        }
        return [];
    };
});

// Pull the Op.or search group out of the where[Op.and] literal/clause list.
function findSearchGroup(where) {
    const and = where[Op.and] || [];
    return and.find((c) => c && typeof c === 'object' && Array.isArray(c[Op.or])) || null;
}

test('response is backward-compatible AND adds facets', async () => {
    const out = await storefront.listProducts(STORE, {});
    // Legacy contract unchanged.
    assert.equal(out.total, 1);
    assert.equal(out.page, 1);
    assert.equal(out.pageSize, 20);
    assert.equal(out.totalPages, 1);
    assert.equal(out.items.length, 1);
    assert.equal(out.items[0].name, 'Hermès Birkin 25');
    // New facets object with the documented keys.
    assert.deepEqual(Object.keys(out.facets).sort(), ['brand', 'color', 'condition', 'price', 'size']);
    assert.deepEqual(out.facets.brand, [{ value: 'hermes', count: 3 }, { value: 'chanel', count: 1 }]);
    assert.deepEqual(out.facets.color, [{ value: 'black', count: 2 }, { value: 'tan', count: 2 }]);
    assert.deepEqual(out.facets.size, [{ value: '25', count: 4 }]);
    // null-grade row is dropped by shapeBuckets.
    assert.deepEqual(out.facets.condition, [{ value: 'pristine', count: 4 }]);
    assert.deepEqual(out.facets.price, { min: 500, max: 12000 });
});

test('keyword search builds a real multi-column ILIKE OR-group (not name-only, not ignored)', async () => {
    await storefront.listProducts(STORE, { search: 'birkin' });
    const group = findSearchGroup(lastFindArgs.where);
    assert.ok(group, 'an Op.or search group is present in where[Op.and]');
    const ors = group[Op.or];
    // name + sku + description structured clauses, plus brand + tags raw literals = 5 branches.
    assert.equal(ors.length, 5);
    const nameClause = ors.find((c) => c && c.name);
    assert.ok(nameClause.name[Op.iLike].includes('birkin'), 'name ILIKE %birkin%');
});

test('the `q` alias is honoured the same as `search`', async () => {
    await storefront.listProducts(STORE, { q: 'chanel' });
    assert.ok(findSearchGroup(lastFindArgs.where), 'q triggers the same search group');
});

test('blank search adds NO search group (does not filter everything out)', async () => {
    await storefront.listProducts(STORE, { search: '   ' });
    assert.equal(findSearchGroup(lastFindArgs.where), null);
});

test('facet filters land in the WHERE: condition as a column Op.in, brand/color/size as literals', async () => {
    await storefront.listProducts(STORE, { brand: 'hermes,chanel', color: 'black', size: '25', condition: 'pristine', minPrice: '100', maxPrice: '5000' });
    const where = lastFindArgs.where;
    // condition is a real column → spread directly onto where.
    assert.deepEqual(where.condition[Op.in], ['pristine']);
    // brand + color + size + price = 4 literal fragments in the AND list.
    const and = where[Op.and] || [];
    const literals = and.filter((c) => c && typeof c.val === 'string'); // Sequelize Literal has .val
    assert.ok(literals.length >= 4, 'brand/color/size/price predicates present as literals');
});

test('categoryId slug is resolved to a UUID and applied to the WHERE', async () => {
    await storefront.listProducts(STORE, { categoryId: 'handbags' });
    assert.equal(lastFindArgs.where.categoryId, 'cat-handbags');
});

test('facet counts run exactly one query per dimension + one price query (no N+1)', async () => {
    await storefront.listProducts(STORE, { brand: 'hermes' });
    // 4 dimension queries (brand/color/size/condition) + 1 price range = 5 grouped passes.
    assert.equal(rawQueries.length, 5);
    // The brand dimension query must EXCLUDE its own selection (mutual-exclusion faceting).
    const brandQ = rawQueries.find((s) => s.includes("GROUP BY p.custom_fields->>'brandId'"));
    assert.ok(brandQ && !brandQ.includes("brandId') IN"), 'brand facet excludes its own filter');
});

test('unknown store → 404 before any product/facet query runs', async () => {
    await assert.rejects(() => storefront.listProducts('nope', {}), (e) => e.statusCode === 404);
    assert.equal(lastFindArgs, null);
    assert.equal(rawQueries.length, 0);
});
