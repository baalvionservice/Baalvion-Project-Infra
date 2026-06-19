'use strict';
// Storefront faceted-search WHERE + facet aggregation builders. PURE (no DB, no IO) so the
// query-building logic is unit-testable in isolation; storefrontService wires the produced
// fragments into Sequelize (main list query) and into one grouped raw aggregate per facet
// dimension (counts).
//
// ── WHERE brand / color / size actually live ──────────────────────────────────────────────
// commerce_products has NO brand/color/size columns. The Amarisé storefront stores them in the
// product's `custom_fields` JSONB (the same source utils/storefrontSerializer.js reads):
//   • brand  → custom_fields->>'brandId'   (scalar text,    e.g. "hermes")
//   • color  → custom_fields->'colors'     (jsonb string[], e.g. ["black","tan"])
//   • size   → custom_fields->'sizes'      (jsonb string[], e.g. ["25","30"])
//   • price  → custom_fields->>'basePrice' (scalar number,  base/USD; FX is a read-time concern)
// `condition` IS a first-class typed column (commerce_products.condition — model + migration
// 20260619, with the perf index added by this feature's index migration), so it is filtered and
// aggregated as a real column, not via JSONB.
//
// ── Filter semantics ──────────────────────────────────────────────────────────────────────
// Multiple values for one facet = OR within the facet; different facets = AND across facets
// (standard faceted-search behaviour). Every filter is optional and combinable.
//
// ── Injection safety ────────────────────────────────────────────────────────────────────
// Two consumers, two safe mechanisms:
//   1. The main product LIST query uses Sequelize `literal` fragments whose VALUES are quoted by
//      the caller-supplied `escape` (sequelize.escape → a fully-quoted, injection-safe SQL string
//      literal, equivalent to a bound param). Nothing is concatenated raw.
//   2. The facet COUNT queries use raw `sequelize.query` with NAMED BIND PARAMETERS ($b0, $b1…);
//      no value is interpolated into the SQL text. (Sequelize v6 binds are `$name`, not `:name`;
//      the JSONB `?|` operator carries no `$` so it survives bind substitution untouched.) JSONB
//      key names ('colors'/'sizes') are trusted internal constants, never user input.
// `condition` values are additionally clamped to a fixed allowlist.

const CONDITION_VALUES = ['pristine', 'excellent', 'very_good', 'good', 'fair', 'vintage'];

// Facet dimensions we expose counts for. brand/color/size are JSONB-backed; condition is a column.
const FACET_DIMENSIONS = ['brand', 'color', 'size', 'condition'];

// ── Input normalisation ─────────────────────────────────────────────────────────────────────

// Normalise a query param that may be a single value, a comma-joined string, or an array into a
// de-duped, trimmed, non-empty string[]. Returns [] when nothing usable is present.
function toValueList(raw) {
    if (raw == null) return [];
    const flat = Array.isArray(raw) ? raw : String(raw).split(',');
    const out = [];
    const seen = new Set();
    for (const v of flat) {
        const s = String(v).trim();
        if (!s || seen.has(s)) continue;
        seen.add(s);
        out.push(s);
    }
    return out;
}

// Clamp condition values to the DB allowlist (defense-in-depth; also enforced by the column CHECK).
function normalizeConditions(raw) {
    return toValueList(raw).filter((v) => CONDITION_VALUES.includes(v));
}

// Parse a price bound to a finite, non-negative number, or null when absent/invalid.
function parsePriceBound(raw) {
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Parse the raw storefront query into a normalised, validated facet-filter selection. Pure — no DB.
 * This object is the single source of truth consumed by both the list-query and count-query builders.
 */
function parseFacetFilters(query = {}) {
    return {
        brand: toValueList(query.brand),
        color: toValueList(query.color),
        size: toValueList(query.size),
        condition: normalizeConditions(query.condition),
        minPrice: parsePriceBound(query.minPrice),
        maxPrice: parsePriceBound(query.maxPrice),
    };
}

// ── (1) Sequelize `literal` predicates for the main LIST query ───────────────────────────────
// Each returns a Sequelize literal fragment (or null when inactive). `escape` = sequelize.escape;
// `literal` = Sequelize's literal.

function brandPredicate(values, { escape, literal }) {
    if (!values.length) return null;
    const inList = values.map((v) => escape(v)).join(', ');
    // OR within facet: custom_fields->>'brandId' IN ('a','b'). Scalar text extraction.
    return literal(`(custom_fields->>'brandId') IN (${inList})`);
}

// JSONB array OVERLAP via the `?|` ANY-key text-array operator: true when the product's array shares
// ANY value with the requested set (OR within facet). key is a trusted constant ('colors'|'sizes').
function jsonbArrayOverlapPredicate(key, values, { escape, literal }) {
    if (!values.length) return null;
    const arr = values.map((v) => escape(v)).join(', ');
    return literal(`(custom_fields->'${key}') ?| array[${arr}]`);
}
const colorPredicate = (values, deps) => jsonbArrayOverlapPredicate('colors', values, deps);
const sizePredicate = (values, deps) => jsonbArrayOverlapPredicate('sizes', values, deps);

// condition is a real typed column → structured Op.in clause (no raw SQL).
function conditionClause(values, Op) {
    if (!values.length) return null;
    return { condition: { [Op.in]: values } };
}

// Base price = custom_fields->>'basePrice'. Numeric range; min/max are pre-parsed finite numbers.
function pricePredicate(minPrice, maxPrice, { literal }) {
    const parts = [];
    // Numeric literals only (already coerced via Number()), so direct embedding is injection-safe.
    if (minPrice != null) parts.push(`COALESCE((custom_fields->>'basePrice')::numeric, 0) >= ${Number(minPrice)}`);
    if (maxPrice != null) parts.push(`COALESCE((custom_fields->>'basePrice')::numeric, 0) <= ${Number(maxPrice)}`);
    if (!parts.length) return null;
    return literal(`(${parts.join(' AND ')})`);
}

/**
 * Build additive facet WHERE fragments for the main LIST query.
 *
 * @param {object} selection  parseFacetFilters() output
 * @param {object} deps       { Op, literal, escape }
 * @param {object} [opts]     { exclude?: 'brand'|'color'|'size'|'condition'|'price' } — omit one
 *                            dimension's own predicate (used by facet counts so a facet does not
 *                            collapse its own options — standard faceting).
 * @returns {{ and: Array, clause: object }}  `and` → where[Op.and] literal[]; `clause` → column
 *                            clauses to spread into the where object (condition Op.in).
 */
function buildFacetWhere(selection, deps, opts = {}) {
    const { Op } = deps;
    const exclude = opts.exclude || null;
    const and = [];
    const clause = {};

    if (exclude !== 'brand') { const p = brandPredicate(selection.brand, deps); if (p) and.push(p); }
    if (exclude !== 'color') { const p = colorPredicate(selection.color, deps); if (p) and.push(p); }
    if (exclude !== 'size') { const p = sizePredicate(selection.size, deps); if (p) and.push(p); }
    if (exclude !== 'condition') { const c = conditionClause(selection.condition, Op); if (c) Object.assign(clause, c); }
    if (exclude !== 'price') { const p = pricePredicate(selection.minPrice, selection.maxPrice, deps); if (p) and.push(p); }
    return { and, clause };
}

// ── (2) Raw, fully-bound SQL for the facet COUNT queries ─────────────────────────────────────
// One grouped aggregate query PER dimension (no N+1, no per-product loop). Every value is passed
// as a NAMED BIND PARAM — nothing is interpolated into the SQL text. Each dimension is counted with
// the OTHER active filters applied but its OWN selection EXCLUDED, so selecting a value never
// collapses that facet's option list (mutual-exclusion faceting).
//
// Returns { sql, binds } ready for sequelize.query(sql, { bind, type: SELECT }).

// brand/condition: scalar GROUP BY (brand from JSONB, condition from the column).
// color/size: expand the JSONB array with jsonb_array_elements_text so each member is one row;
//             COUNT(*) grouped by the element = number of matching products carrying that value
//             (a product contributes each of its own array members exactly once).
const DIMENSION_GROUP = {
    brand: { valueExpr: `p.custom_fields->>'brandId'`, from: 'commerce.commerce_products p' },
    condition: { valueExpr: 'p.condition', from: 'commerce.commerce_products p' },
    color: { valueExpr: 'elem', from: `commerce.commerce_products p, LATERAL jsonb_array_elements_text(p.custom_fields->'colors') AS elem` },
    size: { valueExpr: 'elem', from: `commerce.commerce_products p, LATERAL jsonb_array_elements_text(p.custom_fields->'sizes') AS elem` },
};

// Build the WHERE clause (string) + binds for the facet-count queries. `base` carries the always-on
// scalar predicates (storeId, status, visibility, optional categoryId) the service resolves; we add
// the facet predicates here, excluding the named dimension. Region/collection filters are applied by
// the service to the LIST query only — facet counts are scoped to the catalog + scalar/facet filters,
// which keeps the count query to a single grouped pass (documented simplification).
function buildCountWhereSql(selection, base, exclude) {
    const clauses = [];
    const binds = {};
    let i = 0;
    // Sequelize v6 named binds are `$name` (NOT `:name`). The returned placeholder must be `$bN`.
    const bind = (val) => { const k = `b${i++}`; binds[k] = val; return `$${k}`; };

    // Always-on scalar scope.
    clauses.push(`p.store_id = ${bind(base.storeId)}`);
    clauses.push(`p.status = ${bind('published')}`);
    clauses.push(`p.visibility = ${bind('public')}`);
    if (base.categoryId) clauses.push(`p.category_id = ${bind(base.categoryId)}`);

    // brand (OR within facet)
    if (exclude !== 'brand' && selection.brand.length) {
        const ph = selection.brand.map((v) => bind(v)).join(', ');
        clauses.push(`(p.custom_fields->>'brandId') IN (${ph})`);
    }
    // color overlap
    if (exclude !== 'color' && selection.color.length) {
        const ph = selection.color.map((v) => bind(v)).join(', ');
        clauses.push(`(p.custom_fields->'colors') ?| array[${ph}]`);
    }
    // size overlap
    if (exclude !== 'size' && selection.size.length) {
        const ph = selection.size.map((v) => bind(v)).join(', ');
        clauses.push(`(p.custom_fields->'sizes') ?| array[${ph}]`);
    }
    // condition (column, OR within facet)
    if (exclude !== 'condition' && selection.condition.length) {
        const ph = selection.condition.map((v) => bind(v)).join(', ');
        clauses.push(`p.condition IN (${ph})`);
    }
    // price range
    if (exclude !== 'price' && selection.minPrice != null) {
        clauses.push(`COALESCE((p.custom_fields->>'basePrice')::numeric, 0) >= ${bind(selection.minPrice)}`);
    }
    if (exclude !== 'price' && selection.maxPrice != null) {
        clauses.push(`COALESCE((p.custom_fields->>'basePrice')::numeric, 0) <= ${bind(selection.maxPrice)}`);
    }

    return { whereSql: clauses.join(' AND '), binds };
}

/** Build the grouped COUNT(*) query for one facet dimension. @returns {{ sql, binds }} */
function buildDimensionCountQuery(dimension, selection, base) {
    const cfg = DIMENSION_GROUP[dimension];
    if (!cfg) throw new Error(`Unknown facet dimension: ${dimension}`);
    const { whereSql, binds } = buildCountWhereSql(selection, base, dimension);
    const sql =
        `SELECT ${cfg.valueExpr} AS value, COUNT(*)::int AS count`
        + ` FROM ${cfg.from}`
        + ` WHERE ${whereSql} AND ${cfg.valueExpr} IS NOT NULL`
        + ` GROUP BY ${cfg.valueExpr}`;
    return { sql, binds };
}

/** Build the price MIN/MAX query over the current filter set (price excluded from its own scope). */
function buildPriceRangeQuery(selection, base) {
    const { whereSql, binds } = buildCountWhereSql(selection, base, 'price');
    const sql =
        `SELECT MIN(COALESCE((p.custom_fields->>'basePrice')::numeric, 0)) AS min,`
        + ` MAX(COALESCE((p.custom_fields->>'basePrice')::numeric, 0)) AS max`
        + ` FROM commerce.commerce_products p WHERE ${whereSql}`;
    return { sql, binds };
}

// ── Response shaping (pure) ───────────────────────────────────────────────────────────────────

/** Shape grouped {value,count} rows into the response bucket array, count DESC then value ASC. */
function shapeBuckets(rows) {
    return (rows || [])
        .filter((r) => r && r.value != null && String(r.value) !== '')
        .map((r) => ({ value: String(r.value), count: Number(r.count) || 0 }))
        .sort((a, b) => (b.count - a.count) || a.value.localeCompare(b.value));
}

/** Shape a price MIN/MAX row into { min, max } or null when no in-scope product carries a price.
 * MIN/MAX over an empty result set comes back as SQL NULL (JS null/undefined) — that must map to
 * null, NOT {min:0,max:0}, so the UI knows there is no price range to render a slider for. */
function shapePriceRange(row) {
    if (!row || row.min == null || row.max == null) return null;
    const min = Number(row.min);
    const max = Number(row.max);
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return { min, max };
}

/**
 * Assemble the final `facets` response object from per-dimension bucket arrays + a price range.
 * Backward-additive: lives alongside the existing { data, pagination }. Pure.
 */
function shapeFacets({ brand = [], color = [], size = [], condition = [], priceRange = null } = {}) {
    return { brand, color, size, condition, price: priceRange };
}

module.exports = {
    CONDITION_VALUES,
    FACET_DIMENSIONS,
    toValueList,
    normalizeConditions,
    parsePriceBound,
    parseFacetFilters,
    buildFacetWhere,
    buildCountWhereSql,
    buildDimensionCountQuery,
    buildPriceRangeQuery,
    shapeBuckets,
    shapePriceRange,
    shapeFacets,
    // exported for unit tests
    brandPredicate,
    colorPredicate,
    sizePredicate,
    conditionClause,
    pricePredicate,
};
