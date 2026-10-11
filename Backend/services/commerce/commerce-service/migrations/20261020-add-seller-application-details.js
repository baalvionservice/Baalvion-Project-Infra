'use strict';
/**
 * A seller application now carries the details an admin needs to decide (what they sell, where, how they ship, sample
 * products, how to reach them) as one JSON object, and an admin setting decides whether an approved seller's listings go
 * straight to the marketplace.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn({ tableName: 'commerce_seller_applications', schema: 'commerce' }, 'details', { type: Sequelize.JSONB, allowNull: false, defaultValue: {} });
        await queryInterface.sequelize.query(
            `INSERT INTO commerce.commerce_payment_settings (key, value) VALUES ('auto_publish_listings', 'on') ON CONFLICT (key) DO NOTHING`);
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query(`DELETE FROM commerce.commerce_payment_settings WHERE key = 'auto_publish_listings'`);
        await queryInterface.removeColumn({ tableName: 'commerce_seller_applications', schema: 'commerce' }, 'details');
    },
};
