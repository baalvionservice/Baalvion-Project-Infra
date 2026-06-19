'use strict';
// Performance indexes for the storefront faceted-search endpoint
// (GET /api/v1/commerce/storefront/:storeId/products). Orders AFTER the condition/authenticity
// migration (20260619) which adds the `condition` column.
//
// What the facet/search queries hit and the index that supports each:
//   • condition (typed column, filter + GROUP BY)  → btree(store_id, condition) partial-on-published
//   • color  = custom_fields->'colors' ?| […]  (filter, jsonb_array_elements_text) → GIN(custom_fields)
//   • size   = custom_fields->'sizes'  ?| […]  (filter, jsonb_array_elements_text) → same GIN index
//   • brand  = custom_fields->>'brandId' (filter, GROUP BY, search ILIKE) → scalar text extraction
//   • price  = custom_fields->>'basePrice' (range, MIN/MAX) → expression btree on the numeric cast
//
// A single GIN index on the whole custom_fields JSONB serves the `?|` / `?` key-existence operators
// used for colors/sizes overlap, which keeps the index footprint to one structure for the JSONB
// facets. NOTE: the DEFAULT jsonb_ops opclass is required here — `jsonb_path_ops` only indexes the
// `@>` containment operator and would NOT be used by `?|`. The expression btree on basePrice
// supports the range scan + MIN/MAX aggregate without a sequential scan. (brandId is a scalar
// `->>'brandId'` text lookup; if it ever becomes a hot path, add a dedicated expression btree on
// `(custom_fields->>'brandId')` — the GIN index does not accelerate the `->>` text extraction.)
//
// All indexes are created IF NOT EXISTS so the migration is idempotent/re-runnable, and dropped in
// down(). Raw SQL (not queryInterface.addIndex) because the JSONB-operator-class + expression
// indexes aren't expressible via the helper. No CONCURRENTLY: it cannot run inside the migration
// transaction; for a large live table, run the equivalent CREATE INDEX CONCURRENTLY out-of-band.
const SCHEMA = 'commerce';
const TABLE = 'commerce_products';

const STATEMENTS = {
    facetCondition:
        `CREATE INDEX IF NOT EXISTS idx_products_store_condition`
        + ` ON ${SCHEMA}.${TABLE} (store_id, condition)`
        + ` WHERE status = 'published' AND visibility = 'public';`,
    facetCustomFieldsGin:
        // Default jsonb_ops opclass (NOT jsonb_path_ops) so the `?|`/`?` key-existence operators
        // used by the color/size overlap predicates are index-supported.
        `CREATE INDEX IF NOT EXISTS idx_products_custom_fields_gin`
        + ` ON ${SCHEMA}.${TABLE} USING GIN (custom_fields);`,
    facetBasePrice:
        `CREATE INDEX IF NOT EXISTS idx_products_base_price`
        + ` ON ${SCHEMA}.${TABLE} (((custom_fields->>'basePrice')::numeric))`
        + ` WHERE status = 'published' AND visibility = 'public';`,
};

module.exports = {
    async up(queryInterface) {
        const q = queryInterface.sequelize;
        await q.query(STATEMENTS.facetCondition);
        await q.query(STATEMENTS.facetCustomFieldsGin);
        await q.query(STATEMENTS.facetBasePrice);
    },

    async down(queryInterface) {
        const q = queryInterface.sequelize;
        await q.query(`DROP INDEX IF EXISTS ${SCHEMA}.idx_products_base_price;`);
        await q.query(`DROP INDEX IF EXISTS ${SCHEMA}.idx_products_custom_fields_gin;`);
        await q.query(`DROP INDEX IF EXISTS ${SCHEMA}.idx_products_store_condition;`);
    },
};
