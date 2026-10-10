'use strict';
/**
 * One row per platform user (buyer or seller): their permanent personal member number and an
 * optional display name they chose. display_name NULL means "derive it" (store name for sellers,
 * first name + last initial for buyers), so it stays right without a backfill.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_member_profiles', {
            user_id: { type: Sequelize.BIGINT, primaryKey: true },
            member_number: { type: Sequelize.INTEGER, allowNull: false },
            display_name: { type: Sequelize.STRING(80), allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_member_profiles', ['member_number'], { unique: true, name: 'commerce_member_profiles_number_uq' });
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'commerce_member_profiles', schema: 'commerce' }); },
};
