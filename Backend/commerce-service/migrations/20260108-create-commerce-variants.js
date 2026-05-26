'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_product_variants', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            product_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_products', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            sku: { type: Sequelize.STRING(200), allowNull: false, unique: true },
            barcode: { type: Sequelize.STRING(100), allowNull: true },
            name: { type: Sequelize.STRING(200), allowNull: true },
            attribute_values: { type: Sequelize.JSONB, defaultValue: JSON.stringify([]) },
            price: { type: Sequelize.DECIMAL(15, 4), allowNull: false, defaultValue: 0 },
            compare_at_price: { type: Sequelize.DECIMAL(15, 4), allowNull: true },
            cost_price: { type: Sequelize.DECIMAL(15, 4), allowNull: true },
            currency_code: { type: Sequelize.CHAR(3), defaultValue: 'USD' },
            weight: { type: Sequelize.DECIMAL(10, 3), allowNull: true },
            dimensions: { type: Sequelize.JSONB, allowNull: true },
            is_default: { type: Sequelize.BOOLEAN, defaultValue: false },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            requires_shipping: { type: Sequelize.BOOLEAN, defaultValue: true },
            sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_product_variants', ['product_id']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'commerce_product_variants', schema: 'commerce' }); },
};
