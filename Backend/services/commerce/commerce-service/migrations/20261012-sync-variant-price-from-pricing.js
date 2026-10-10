'use strict';
/**
 * Listings priced from the seller screen before the pricing fix stored the price only in
 * commerce_product_pricing while the shop and checkout read variant.price, so they showed 0.
 * Copy that price onto variants that are still at 0. Only touches zero-priced variants and only
 * unscheduled, active prices; never overwrites a price someone set on the variant.
 */
module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.query(`
            UPDATE commerce.commerce_product_variants v
               SET price = p.price, currency_code = p.currency_code, updated_at = NOW()
              FROM (
                SELECT DISTINCT ON (product_id, COALESCE(variant_id::text, 'default')) *
                  FROM commerce.commerce_product_pricing
                 WHERE is_active = true AND starts_at IS NULL AND ends_at IS NULL AND price > 0
                 ORDER BY product_id, COALESCE(variant_id::text, 'default'), updated_at DESC
              ) p
             WHERE p.product_id = v.product_id
               AND (p.variant_id = v.id OR (p.variant_id IS NULL AND v.is_default = true))
               AND v.price = 0`);
    },
    async down() { /* data repair: nothing to undo */ },
};
