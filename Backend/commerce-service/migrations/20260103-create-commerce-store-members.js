'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_store_members', {
            id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_stores', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            user_id: { type: Sequelize.BIGINT, allowNull: false },
            role: { type: Sequelize.ENUM('store_admin', 'commerce_manager', 'inventory_manager', 'seo_manager', 'fulfillment_manager', 'support_agent', 'content_editor', 'reviewer'), allowNull: false },
            invited_by: { type: Sequelize.BIGINT, allowNull: true },
            joined_at: { type: Sequelize.DATE, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addConstraint('commerce.commerce_store_members', { fields: ['store_id', 'user_id'], type: 'unique', name: 'store_members_store_user_unique' });
        await queryInterface.addIndex('commerce.commerce_store_members', ['store_id']);
        await queryInterface.addIndex('commerce.commerce_store_members', ['user_id']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'commerce_store_members', schema: 'commerce' }); },
};
