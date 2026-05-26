'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_product_pricing', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            product_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_products', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            variant_id: { type: Sequelize.UUID, allowNull: true, references: { model: { tableName: 'commerce_product_variants', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            store_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_stores', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            price: { type: Sequelize.DECIMAL(15, 4), allowNull: false },
            compare_at_price: { type: Sequelize.DECIMAL(15, 4), allowNull: true },
            cost_price: { type: Sequelize.DECIMAL(15, 4), allowNull: true },
            currency_code: { type: Sequelize.CHAR(3), allowNull: false },
            tax_class: { type: Sequelize.STRING(50), defaultValue: 'standard' },
            tax_rate: { type: Sequelize.DECIMAL(5, 2), allowNull: true },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            starts_at: { type: Sequelize.DATE, allowNull: true },
            ends_at: { type: Sequelize.DATE, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_product_pricing', ['product_id']);
        await queryInterface.addIndex('commerce.commerce_product_pricing', ['store_id']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'commerce_product_pricing', schema: 'commerce' }); },
};
