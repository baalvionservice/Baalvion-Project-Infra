'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_attributes', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            group_id: { type: Sequelize.UUID, allowNull: false, references: { model: { tableName: 'commerce_attribute_groups', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
            value: { type: Sequelize.STRING(200), allowNull: false },
            label: { type: Sequelize.STRING(200), allowNull: false },
            color_hex: { type: Sequelize.STRING(7), allowNull: true },
            sort_order: { type: Sequelize.INTEGER, defaultValue: 0 },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_attributes', ['group_id']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'commerce_attributes', schema: 'commerce' }); },
};
