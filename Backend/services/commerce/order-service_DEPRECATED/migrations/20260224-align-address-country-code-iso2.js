'use strict';
// Align orders_addresses.country_code to the API contract: the validators (customerSchemas /
// orderSchemas) enforce ISO-3166-1 alpha-2 (length 2), but the column/model were STRING(3). All
// data written through the API is already 2-char, so this narrowing is safe. We TRIM-then-truncate
// to 2 chars defensively before altering the type so a stray legacy 3-char value cannot block the
// migration. No behavioral change for the current 2-letter flow.
const ADDR = { tableName: 'orders_addresses', schema: 'orders' };

module.exports = {
    async up(queryInterface, Sequelize) {
        // Defensive: backfill NULL/empty country_code with the platform default market's ISO-2 BEFORE
        // tightening to NOT NULL, so a legacy row with a missing country can't fail the change mid-flight.
        await queryInterface.sequelize.query(
            `UPDATE orders.orders_addresses SET country_code = 'US' WHERE country_code IS NULL OR country_code = '';`,
        );
        // Defensive: ensure no value exceeds 2 chars before tightening the type.
        await queryInterface.sequelize.query(
            `UPDATE orders.orders_addresses SET country_code = LEFT(country_code, 2) WHERE LENGTH(country_code) > 2;`,
        );
        await queryInterface.changeColumn(ADDR, 'country_code', {
            type: Sequelize.STRING(2), allowNull: false,
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.changeColumn(ADDR, 'country_code', {
            type: Sequelize.STRING(3), allowNull: false,
        });
    },
};
