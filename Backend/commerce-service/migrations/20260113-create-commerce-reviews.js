'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_product_reviews', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            product_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_products', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            store_id: { type: Sequelize.UUID, allowNull: false },
            customer_id: { type: Sequelize.UUID, allowNull: false },
            rating: { type: Sequelize.INTEGER, allowNull: false },
            title: { type: Sequelize.STRING(200), allowNull: true },
            body: { type: Sequelize.TEXT, allowNull: true },
            status: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
            is_verified_purchase: { type: Sequelize.BOOLEAN, defaultValue: false },
            helpful_count: { type: Sequelize.INTEGER, defaultValue: 0 },
            reply: { type: Sequelize.TEXT, allowNull: true },
            reply_at: { type: Sequelize.DATE, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_product_reviews', ['product_id']);
        await queryInterface.addIndex('commerce.commerce_product_reviews', ['store_id']);
        await queryInterface.addIndex('commerce.commerce_product_reviews', ['status']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'commerce_product_reviews', schema: 'commerce' }); },
};
