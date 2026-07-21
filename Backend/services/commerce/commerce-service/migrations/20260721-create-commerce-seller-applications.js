'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('commerce_seller_applications', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.literal('gen_random_uuid()'), primaryKey: true },
            applicant_user_id: { type: Sequelize.BIGINT, allowNull: false },
            applicant_org_id: { type: Sequelize.UUID, allowNull: false },
            store_name: { type: Sequelize.STRING(200), allowNull: false },
            store_code: { type: Sequelize.STRING(20), allowNull: false },
            country_code: { type: Sequelize.CHAR(2), allowNull: false },
            currency_code: { type: Sequelize.CHAR(3), allowNull: false },
            description: { type: Sequelize.TEXT, allowNull: true },
            status: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
            rejection_reason: { type: Sequelize.TEXT, allowNull: true },
            reviewed_by: { type: Sequelize.BIGINT, allowNull: true },
            reviewed_at: { type: Sequelize.DATE, allowNull: true },
            created_store_id: { type: Sequelize.UUID, allowNull: true },
            created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
            updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
        }, { schema: 'commerce' });
        await queryInterface.addIndex('commerce.commerce_seller_applications', ['applicant_user_id']);
        await queryInterface.addIndex('commerce.commerce_seller_applications', ['status']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'commerce_seller_applications', schema: 'commerce' }); },
};
