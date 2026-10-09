'use strict';
/**
 * Buyers pay a one-time access fee to enter the marketplace. It uses the same payment table as the
 * seller category payments (same addresses, same hash submission, same admin confirmation), told
 * apart by `kind`. A buyer-access row has no category.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        const t = { tableName: 'commerce_seller_category_bonds', schema: 'commerce' };
        await queryInterface.addColumn(t, 'kind', { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'category' });
        await queryInterface.sequelize.query('ALTER TABLE commerce.commerce_seller_category_bonds ALTER COLUMN category_id DROP NOT NULL');
        // One live access pass per person.
        await queryInterface.sequelize.query(
            `CREATE UNIQUE INDEX commerce_buyer_access_live_uq
             ON commerce.commerce_seller_category_bonds (seller_user_id)
             WHERE kind = 'buyer_access' AND status IN ('awaiting_payment','payment_submitted','active')`
        );
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS commerce.commerce_buyer_access_live_uq');
        // Access-pass rows have no category, so they cannot exist once category_id is NOT NULL again.
        await queryInterface.sequelize.query("DELETE FROM commerce.commerce_seller_category_bonds WHERE kind = 'buyer_access'");
        await queryInterface.sequelize.query('ALTER TABLE commerce.commerce_seller_category_bonds ALTER COLUMN category_id SET NOT NULL');
        await queryInterface.removeColumn({ tableName: 'commerce_seller_category_bonds', schema: 'commerce' }, 'kind');
    },
};
