'use strict';
// Luxury-resale / consignment columns promoted from custom_fields to first-class, typed columns
// on commerce_products. The storefront already renders `condition`/`conditionDetails`; this gives
// them (and the authenticity / one-of-a-kind / serial provenance) a real, queryable home.
//
// Additive & non-breaking: every column is NULLABLE or defaulted, so existing rows are untouched.
// `condition` follows this service's STRING + CHECK convention (see 20260115 reviews migration)
// rather than a Sequelize ENUM type, which keeps an additive column free of ENUM-type lifecycle
// churn while still enforcing the allowed grades at the DB level. The serializer prefers these
// columns and falls back to custom_fields for rows authored before the migration.
const TABLE = { tableName: 'commerce_products', schema: 'commerce' };

const CONDITION_VALUES = ['pristine', 'excellent', 'very_good', 'good', 'fair', 'vintage'];

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn(TABLE, 'condition', { type: Sequelize.STRING(40), allowNull: true });
        await queryInterface.addColumn(TABLE, 'condition_grade', { type: Sequelize.STRING(40), allowNull: true });
        await queryInterface.addColumn(TABLE, 'condition_notes', { type: Sequelize.TEXT, allowNull: true });
        await queryInterface.addColumn(TABLE, 'authenticity_status', { type: Sequelize.STRING(40), allowNull: true });
        await queryInterface.addColumn(TABLE, 'authenticity_certificate_code', { type: Sequelize.STRING(120), allowNull: true });
        await queryInterface.addColumn(TABLE, 'is_one_of_a_kind', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
        await queryInterface.addColumn(TABLE, 'serial_number', { type: Sequelize.STRING(120), allowNull: true });

        // DB-level grade allowlist (defense-in-depth; also enforced in Zod + the model validator).
        // NULL is allowed so the column stays optional for non-resale catalog rows.
        const allowed = CONDITION_VALUES.map((v) => `'${v}'`).join(', ');
        await queryInterface.sequelize.query(
            `ALTER TABLE commerce.commerce_products`
            + ` ADD CONSTRAINT chk_product_condition`
            + ` CHECK (condition IS NULL OR condition IN (${allowed}));`
        );
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query(
            `ALTER TABLE commerce.commerce_products DROP CONSTRAINT IF EXISTS chk_product_condition;`
        );
        await queryInterface.removeColumn(TABLE, 'serial_number');
        await queryInterface.removeColumn(TABLE, 'is_one_of_a_kind');
        await queryInterface.removeColumn(TABLE, 'authenticity_certificate_code');
        await queryInterface.removeColumn(TABLE, 'authenticity_status');
        await queryInterface.removeColumn(TABLE, 'condition_notes');
        await queryInterface.removeColumn(TABLE, 'condition_grade');
        await queryInterface.removeColumn(TABLE, 'condition');
    },
};
