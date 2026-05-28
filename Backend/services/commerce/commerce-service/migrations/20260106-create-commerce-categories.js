'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_categories', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_stores', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            parent_id: { type: Sequelize.UUID, allowNull: true },
            name: { type: Sequelize.STRING(200), allowNull: false },
            slug: { type: Sequelize.STRING(200), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            image_url: { type: Sequelize.TEXT, allowNull: true },
            seo_metadata: { type: Sequelize.JSONB, defaultValue: JSON.stringify({}) },
            sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
            depth: { type: Sequelize.INTEGER, defaultValue: 0 },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            product_count: { type: Sequelize.INTEGER, defaultValue: 0 },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addConstraint('commerce.commerce_categories', { fields: ['store_id', 'slug'], type: 'unique', name: 'commerce_categories_store_slug_unique' });
        await queryInterface.addIndex('commerce.commerce_categories', ['store_id']);
        await queryInterface.addIndex('commerce.commerce_categories', ['parent_id']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'commerce_categories', schema: 'commerce' }); },
};
