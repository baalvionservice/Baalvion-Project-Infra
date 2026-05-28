'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_stores', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            organization_id: { type: Sequelize.UUID, allowNull: false },
            name: { type: Sequelize.STRING(200), allowNull: false },
            code: { type: Sequelize.STRING(20), allowNull: false, unique: true },
            country_code: { type: Sequelize.CHAR(2), allowNull: false },
            currency_code: { type: Sequelize.CHAR(3), allowNull: false },
            locale: { type: Sequelize.STRING(20), defaultValue: 'en' },
            timezone: { type: Sequelize.STRING(50), defaultValue: 'UTC' },
            status: { type: Sequelize.ENUM('active', 'inactive', 'maintenance'), defaultValue: 'active' },
            tax_inclusive: { type: Sequelize.BOOLEAN, defaultValue: false },
            default_tax_rate: { type: Sequelize.DECIMAL(5, 2), defaultValue: 0 },
            payment_gateways: { type: Sequelize.JSONB, defaultValue: JSON.stringify([]) },
            shipping_config: { type: Sequelize.JSONB, defaultValue: JSON.stringify({}) },
            seo_config: { type: Sequelize.JSONB, defaultValue: JSON.stringify({}) },
            meta: { type: Sequelize.JSONB, defaultValue: JSON.stringify({}) },
            created_by: { type: Sequelize.BIGINT, allowNull: false },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_stores', ['organization_id']);
        await queryInterface.addIndex('commerce.commerce_stores', ['status']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'commerce_stores', schema: 'commerce' }); },
};
