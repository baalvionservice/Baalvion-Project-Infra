'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_attribute_groups', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            store_id: { type: Sequelize.UUID, allowNull: true },
            name: { type: Sequelize.STRING(100), allowNull: false },
            slug: { type: Sequelize.STRING(100), allowNull: false },
            type: { type: Sequelize.ENUM('select', 'multi_select', 'text', 'number', 'boolean', 'color', 'size'), defaultValue: 'select' },
            is_global: { type: Sequelize.BOOLEAN, defaultValue: false },
            sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_attribute_groups', ['store_id']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'commerce_attribute_groups', schema: 'commerce' }); },
};
