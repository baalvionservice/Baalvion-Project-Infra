'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_discounts', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_stores', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            code: { type: Sequelize.STRING(100), allowNull: false },
            name: { type: Sequelize.STRING(200), allowNull: false },
            type: { type: Sequelize.ENUM('percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y'), allowNull: false },
            value: { type: Sequelize.DECIMAL(15, 4), allowNull: false },
            min_purchase_amount: { type: Sequelize.DECIMAL(15, 4), allowNull: true },
            max_discount_amount: { type: Sequelize.DECIMAL(15, 4), allowNull: true },
            usage_limit: { type: Sequelize.INTEGER, allowNull: true },
            usage_count: { type: Sequelize.INTEGER, defaultValue: 0 },
            applies_to: { type: Sequelize.ENUM('all', 'specific_products', 'specific_categories', 'specific_collections'), defaultValue: 'all' },
            target_ids: { type: Sequelize.ARRAY(Sequelize.UUID), defaultValue: [] },
            is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
            starts_at: { type: Sequelize.DATE, allowNull: true },
            ends_at: { type: Sequelize.DATE, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addConstraint('commerce.commerce_discounts', { fields: ['store_id', 'code'], type: 'unique', name: 'commerce_discounts_store_code_unique' });
        await queryInterface.addIndex('commerce.commerce_discounts', ['store_id']);
        await queryInterface.addIndex('commerce.commerce_discounts', ['is_active']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'commerce_discounts', schema: 'commerce' }); },
};
