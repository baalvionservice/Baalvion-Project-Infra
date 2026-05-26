'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_collections', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_stores', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            name: { type: Sequelize.STRING(200), allowNull: false },
            slug: { type: Sequelize.STRING(200), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            image_url: { type: Sequelize.TEXT, allowNull: true },
            seo_metadata: { type: Sequelize.JSONB, defaultValue: JSON.stringify({}) },
            is_automated: { type: Sequelize.BOOLEAN, defaultValue: false },
            automation_rules: { type: Sequelize.JSONB, defaultValue: JSON.stringify({}) },
            sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            product_count: { type: Sequelize.INTEGER, defaultValue: 0 },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addConstraint('commerce.commerce_collections', { fields: ['store_id', 'slug'], type: 'unique', name: 'commerce_collections_store_slug_unique' });
        await queryInterface.createTable('commerce_collection_products', {
            id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
            collection_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_collections', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            product_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_products', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
        }, { schema: 'commerce' });
        await queryInterface.addConstraint('commerce.commerce_collection_products', { fields: ['collection_id', 'product_id'], type: 'unique', name: 'collection_products_unique' });
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'commerce_collection_products', schema: 'commerce' });
        await queryInterface.dropTable({ tableName: 'commerce_collections', schema: 'commerce' });
    },
};
