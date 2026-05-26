'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_product_media', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            product_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_products', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            variant_id: { type: Sequelize.UUID, allowNull: true },
            media_type: { type: Sequelize.ENUM('image', 'video', 'document'), defaultValue: 'image' },
            url: { type: Sequelize.TEXT, allowNull: false },
            thumbnail_url: { type: Sequelize.TEXT, allowNull: true },
            alt_text: { type: Sequelize.STRING(500), allowNull: true },
            sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
            is_featured: { type: Sequelize.BOOLEAN, defaultValue: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_product_media', ['product_id']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'commerce_product_media', schema: 'commerce' }); },
};
