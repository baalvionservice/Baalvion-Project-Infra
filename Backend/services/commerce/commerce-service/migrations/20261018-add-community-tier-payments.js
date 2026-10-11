'use strict';
/**
 * Paid community access tiers (Marketplace, Global Elite, VIP) use the same payment table, addresses,
 * screenshots and admin review as every other payment, told apart by kind = 'community_tier' and the tier slug.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn({ tableName: 'commerce_seller_category_bonds', schema: 'commerce' }, 'tier_slug', { type: Sequelize.STRING(40), allowNull: true });
        await queryInterface.sequelize.query(
            `CREATE UNIQUE INDEX commerce_community_tier_live_uq
             ON commerce.commerce_seller_category_bonds (seller_user_id, tier_slug)
             WHERE kind = 'community_tier' AND status IN ('awaiting_payment','payment_submitted','active')`
        );
    },
    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP INDEX IF EXISTS commerce.commerce_community_tier_live_uq');
        await queryInterface.sequelize.query("DELETE FROM commerce.commerce_seller_category_bonds WHERE kind = 'community_tier'");
        await queryInterface.removeColumn({ tableName: 'commerce_seller_category_bonds', schema: 'commerce' }, 'tier_slug');
    },
};
