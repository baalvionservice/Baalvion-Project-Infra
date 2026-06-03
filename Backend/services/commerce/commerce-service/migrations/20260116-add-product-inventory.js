'use strict';
// Promote inventory stock from the loosely-typed custom_fields.stock JSONB key to first-class,
// typed columns. Backfills stock_quantity from the existing JSONB value so the storefront keeps
// reporting the same stock immediately after migration. Additive — custom_fields.stock is left
// in place for backward compatibility; the serializer prefers the new column when present.
const TABLE = { tableName: 'commerce_products', schema: 'commerce' };

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(TABLE, 'stock_quantity', { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 });
        await queryInterface.addColumn(TABLE, 'track_inventory', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true });
        await queryInterface.addColumn(TABLE, 'allow_backorder', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });

        // Backfill from custom_fields->>'stock' (NULL/empty → 0).
        await queryInterface.sequelize.query(
            `UPDATE commerce.commerce_products`
            + ` SET stock_quantity = COALESCE(NULLIF(custom_fields->>'stock', '')::int, 0);`
        );
    },

    async down(queryInterface) {
        await queryInterface.removeColumn(TABLE, 'allow_backorder');
        await queryInterface.removeColumn(TABLE, 'track_inventory');
        await queryInterface.removeColumn(TABLE, 'stock_quantity');
    },
};
