'use strict';
// Faceted-search filter + facet-aggregation builders (utils/storefrontFilters.js). PURE unit tests
// — no DB, no Sequelize instance. Pins: query-param normalisation, the per-facet WHERE predicates
// (OR-within / AND-across, mutual-exclusion via `exclude`), the grouped COUNT(*) SQL shape + that
// every value is a named bind ($bN, never interpolated), and the response `facets` shaping.

const { test } = require('node:test');
const assert = require('node:assert');
const { Op } = require('sequelize');

const f = require('../utils/storefrontFilters');

// A test double for Sequelize deps used by the LIST-query predicates. `literal` just wraps the SQL
// string so we can assert on it; `escape` mimics sequelize.escape (single-quote + double-up).
const literal = (sql) => ({ __literal: sql });
const escape = (v) => `'${String(v).replace(/'/g, "''")}'`;
const deps = { Op, literal, escape };

// ════════════════════ INPUT NORMALISATION ════════════════════
test('toValueList accepts single value, comma string, and array; trims + de-dupes', () => {
    assert.deepEqual(f.toValueList('hermes'), ['hermes']);
    assert.deepEqual(f.toValueList('hermes, chanel ,hermes'), ['hermes', 'chanel']);
    assert.deepEqual(f.toValueList(['black', 'tan', 'black']), ['black', 'tan']);
    assert.deepEqual(f.toValueList(undefined), []);
    assert.deepEqual(f.toValueList(''), []);
});

test('normalizeConditions clamps to the DB allowlist, dropping unknown grades', () => {
    assert.deepEqual(f.normalizeConditions('pristine,bogus,vintage'), ['pristine', 'vintage']);
    assert.deepEqual(f.normalizeConditions(['fair', 'BAD', 'good']), ['fair', 'good']);
    assert.deepEqual(f.normalizeConditions('nope'), []);
});

test('parsePriceBound coerces finite non-negative numbers, else null', () => {
    assert.equal(f.parsePriceBound('100'), 100);
    assert.equal(f.parsePriceBound(0), 0);
    assert.equal(f.parsePriceBound('abc'), null);
    assert.equal(f.parsePriceBound('-5'), null);
    assert.equal(f.parsePriceBound(undefined), null);
});

test('parseFacetFilters produces the normalised selection object', () => {
    const sel = f.parseFacetFilters({ brand: 'hermes,chanel', color: ['black'], size: '25', condition: 'pristine,xx', minPrice: '100', maxPrice: 'abc' });
    assert.deepEqual(sel, { brand: ['hermes', 'chanel'], color: ['black'], size: ['25'], condition: ['pristine'], minPrice: 100, maxPrice: null });
});

// ════════════════════ LIST-QUERY PREDICATES (Sequelize literal) ════════════════════
test('brandPredicate builds an injection-safe IN list (OR within facet)', () => {
    const p = f.brandPredicate(['hermes', "o'brien"], deps);
    assert.equal(p.__literal, "(custom_fields->>'brandId') IN ('hermes', 'o''brien')");
    assert.equal(f.brandPredicate([], deps), null);
});

test('color/size predicates use the JSONB ?| array overlap operator (OR within facet)', () => {
    assert.equal(f.colorPredicate(['black', 'tan'], deps).__literal, "(custom_fields->'colors') ?| array['black', 'tan']");
    assert.equal(f.sizePredicate(['25'], deps).__literal, "(custom_fields->'sizes') ?| array['25']");
    assert.equal(f.colorPredicate([], deps), null);
});

test('conditionClause is a structured column Op.in clause (real typed column, not JSONB)', () => {
    const c = f.conditionClause(['pristine', 'fair'], Op);
    assert.deepEqual(c.condition[Op.in], ['pristine', 'fair']);
    assert.equal(f.conditionClause([], Op), null);
});

test('pricePredicate builds a numeric range against custom_fields.basePrice', () => {
    assert.equal(f.pricePredicate(100, 500, deps).__literal,
        '(COALESCE((custom_fields->>\'basePrice\')::numeric, 0) >= 100 AND COALESCE((custom_fields->>\'basePrice\')::numeric, 0) <= 500)');
    assert.equal(f.pricePredicate(100, null, deps).__literal,
        '(COALESCE((custom_fields->>\'basePrice\')::numeric, 0) >= 100)');
    assert.equal(f.pricePredicate(null, null, deps), null);
});

test('buildFacetWhere collects all active facets (AND across) into and[] + condition clause', () => {
    const sel = f.parseFacetFilters({ brand: 'hermes', color: 'black', size: '25', condition: 'pristine', minPrice: '100', maxPrice: '500' });
    const { and, clause } = f.buildFacetWhere(sel, deps);
    // brand + color + size + price = 4 literal fragments; condition goes into the column clause.
    assert.equal(and.length, 4);
    assert.deepEqual(clause.condition[Op.in], ['pristine']);
});

test('buildFacetWhere honours exclude: a facet omits its OWN predicate (mutual-exclusion)', () => {
    const sel = f.parseFacetFilters({ brand: 'hermes', color: 'black' });
    assert.equal(f.buildFacetWhere(sel, deps).and.length, 2);              // brand + color
    assert.equal(f.buildFacetWhere(sel, deps, { exclude: 'brand' }).and.length, 1); // color only
    const exCond = f.buildFacetWhere(f.parseFacetFilters({ condition: 'pristine', brand: 'hermes' }), deps, { exclude: 'condition' });
    assert.equal(exCond.clause.condition, undefined, 'excluded condition is not in the column clause');
    assert.equal(exCond.and.length, 1, 'but brand still applies');
});

// ════════════════════ FACET-COUNT SQL (raw, fully bound) ════════════════════
function assertNoRawValues(sql) {
    // No facet value should ever appear inline — only $bN placeholders + trusted constants.
    assert.ok(!/hermes|chanel|black|tan|pristine/i.test(sql), 'no facet value is interpolated into SQL');
    assert.ok(/\$b\d+/.test(sql), 'uses $bN named binds');
}

test('brand count query: scalar JSONB GROUP BY, excludes own selection, all values bound', () => {
    const sel = f.parseFacetFilters({ brand: 'hermes', color: 'black', condition: 'pristine' });
    const { sql, binds } = f.buildDimensionCountQuery('brand', sel, { storeId: 'S1', categoryId: 'C1' });
    assertNoRawValues(sql);
    assert.ok(sql.includes("GROUP BY p.custom_fields->>'brandId'"));
    assert.ok(!sql.includes("brandId') IN"), 'brand excludes its own predicate');
    assert.ok(sql.includes("(p.custom_fields->'colors') ?| array"), 'but applies color');
    assert.ok(sql.includes('p.condition IN'), 'and applies condition');
    // store/status/visibility/category + color + condition = 6 binds (brand excluded).
    assert.deepEqual(Object.values(binds), ['S1', 'published', 'public', 'C1', 'black', 'pristine']);
});

test('color count query expands the JSONB array via jsonb_array_elements_text and groups by element', () => {
    const sel = f.parseFacetFilters({ brand: 'hermes', color: 'black' });
    const { sql, binds } = f.buildDimensionCountQuery('color', sel, { storeId: 'S1', categoryId: null });
    assertNoRawValues(sql);
    assert.ok(sql.includes("LATERAL jsonb_array_elements_text(p.custom_fields->'colors') AS elem"));
    assert.ok(sql.includes('GROUP BY elem'));
    assert.ok(!sql.includes("(p.custom_fields->'colors') ?|"), 'color excludes its own predicate');
    assert.ok(sql.includes("(p.custom_fields->>'brandId') IN"), 'but applies brand');
    // no categoryId here → store/status/visibility + brand = 4 binds.
    assert.deepEqual(Object.values(binds), ['S1', 'published', 'public', 'hermes']);
});

test('condition count query groups by the real column', () => {
    const sel = f.parseFacetFilters({ condition: 'pristine' });
    const { sql } = f.buildDimensionCountQuery('condition', sel, { storeId: 'S1', categoryId: null });
    assert.ok(sql.includes('SELECT p.condition AS value'));
    assert.ok(sql.includes('GROUP BY p.condition'));
    assert.ok(!sql.includes('p.condition IN'), 'condition excludes its own predicate');
});

test('price-range query returns MIN/MAX and drops the price bounds from its own scope', () => {
    const sel = f.parseFacetFilters({ minPrice: '100', maxPrice: '500', brand: 'hermes' });
    const { sql, binds } = f.buildPriceRangeQuery(sel, { storeId: 'S1', categoryId: null });
    assert.ok(sql.includes('MIN(COALESCE') && sql.includes('MAX(COALESCE'));
    assert.ok(!sql.includes('>= $') && !sql.includes('<= $'), 'price bounds excluded from price facet');
    assert.ok(sql.includes("(p.custom_fields->>'brandId') IN"), 'but brand applies');
    assert.deepEqual(Object.values(binds), ['S1', 'published', 'public', 'hermes']);
});

test('unknown dimension throws (guards against a typo opening an unbounded query)', () => {
    assert.throws(() => f.buildDimensionCountQuery('weird', f.parseFacetFilters({}), { storeId: 'S1' }), /Unknown facet dimension/);
});

// ════════════════════ RESPONSE SHAPING ════════════════════
test('shapeBuckets drops null/empty values and sorts by count DESC then value ASC', () => {
    const out = f.shapeBuckets([
        { value: 'tan', count: 2 }, { value: 'black', count: 5 },
        { value: null, count: 9 }, { value: '', count: 1 }, { value: 'red', count: 5 },
    ]);
    assert.deepEqual(out, [
        { value: 'black', count: 5 }, { value: 'red', count: 5 }, { value: 'tan', count: 2 },
    ]);
});

test('shapePriceRange coerces numbers; null when no in-scope price', () => {
    assert.deepEqual(f.shapePriceRange({ min: '10', max: '500' }), { min: 10, max: 500 });
    assert.equal(f.shapePriceRange({ min: null, max: null }), null);
    assert.equal(f.shapePriceRange(undefined), null);
});

test('shapeFacets emits the exact backward-additive response contract', () => {
    const facets = f.shapeFacets({
        brand: [{ value: 'hermes', count: 3 }],
        color: [{ value: 'black', count: 2 }],
        size: [{ value: '25', count: 1 }],
        condition: [{ value: 'pristine', count: 4 }],
        priceRange: { min: 100, max: 5000 },
    });
    assert.deepEqual(Object.keys(facets).sort(), ['brand', 'color', 'condition', 'price', 'size']);
    assert.deepEqual(facets.price, { min: 100, max: 5000 });
    assert.deepEqual(facets.brand, [{ value: 'hermes', count: 3 }]);
    // Empty defaults when a dimension has no buckets.
    assert.deepEqual(f.shapeFacets({}), { brand: [], color: [], size: [], condition: [], price: null });
});
