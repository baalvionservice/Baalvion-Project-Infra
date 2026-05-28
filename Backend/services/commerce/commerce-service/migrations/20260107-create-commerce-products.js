'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_products', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_stores', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            category_id: { type: Sequelize.UUID, allowNull: true, references: { model: { tableName: 'commerce_categories', schema: 'commerce' }, key: 'id' }, onDelete: 'SET NULL' },
            created_by: { type: Sequelize.BIGINT, allowNull: false },
            last_edited_by: { type: Sequelize.BIGINT, allowNull: true },
            name: { type: Sequelize.STRING(500), allowNull: false },
            slug: { type: Sequelize.STRING(500), allowNull: false },
            short_description: { type: Sequelize.TEXT, allowNull: true },
            description: { type: Sequelize.TEXT, allowNull: true },
            product_type: { type: Sequelize.ENUM('simple', 'variable', 'grouped', 'bundle', 'digital'), defaultValue: 'simple' },
            status: { type: Sequelize.ENUM('draft', 'pending_review', 'approved', 'published', 'archived'), defaultValue: 'draft' },
            visibility: { type: Sequelize.ENUM('public', 'private', 'password'), defaultValue: 'public' },
            sku: { type: Sequelize.STRING(200), allowNull: true },
            barcode: { type: Sequelize.STRING(100), allowNull: true },
            weight: { type: Sequelize.DECIMAL(10, 3), allowNull: true },
            weight_unit: { type: Sequelize.STRING(10), defaultValue: 'kg' },
            dimensions: { type: Sequelize.JSONB, allowNull: true },
            materials: { type: Sequelize.ARRAY(Sequelize.TEXT), defaultValue: [] },
            specifications: { type: Sequelize.JSONB, defaultValue: JSON.stringify({}) },
            seo_metadata: { type: Sequelize.JSONB, defaultValue: JSON.stringify({}) },
            tags: { type: Sequelize.ARRAY(Sequelize.TEXT), defaultValue: [] },
            custom_fields: { type: Sequelize.JSONB, defaultValue: JSON.stringify({}) },
            is_featured: { type: Sequelize.BOOLEAN, defaultValue: false },
            is_digital: { type: Sequelize.BOOLEAN, defaultValue: false },
            requires_shipping: { type: Sequelize.BOOLEAN, defaultValue: true },
            download_limit: { type: Sequelize.INTEGER, allowNull: true },
            download_expiry: { type: Sequelize.INTEGER, allowNull: true },
            related_product_ids: { type: Sequelize.ARRAY(Sequelize.UUID), defaultValue: [] },
            upsell_product_ids: { type: Sequelize.ARRAY(Sequelize.UUID), defaultValue: [] },
            cross_sell_product_ids: { type: Sequelize.ARRAY(Sequelize.UUID), defaultValue: [] },
            view_count: { type: Sequelize.BIGINT, defaultValue: 0 },
            revision_count: { type: Sequelize.INTEGER, defaultValue: 0 },
            published_at: { type: Sequelize.DATE, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addConstraint('commerce.commerce_products', { fields: ['store_id', 'slug'], type: 'unique', name: 'commerce_products_store_slug_unique' });
        await queryInterface.addIndex('commerce.commerce_products', ['store_id']);
        await queryInterface.addIndex('commerce.commerce_products', ['category_id']);
        await queryInterface.addIndex('commerce.commerce_products', ['status']);
        await queryInterface.addIndex('commerce.commerce_products', ['product_type']);
        await queryInterface.addIndex('commerce.commerce_products', ['is_featured']);
        await queryInterface.addIndex('commerce.commerce_products', ['published_at']);
        await queryInterface.sequelize.query(`CREATE INDEX IF NOT EXISTS commerce_products_name_fts ON commerce.commerce_products USING gin(to_tsvector('english', name));`);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'commerce_products', schema: 'commerce' }); },
};
