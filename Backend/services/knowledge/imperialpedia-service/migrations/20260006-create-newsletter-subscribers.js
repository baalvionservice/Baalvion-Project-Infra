'use strict';

// Newsletter signups previously went nowhere: the frontend's /api/newsletter route
// validated the email and returned success without storing it anywhere. This table
// gives Imperialpedia's newsletter form a real, durable subscriber list.
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query('CREATE SCHEMA IF NOT EXISTS imperialpedia');
        await queryInterface.createTable(
            { tableName: 'newsletter_subscribers', schema: 'imperialpedia' },
            {
                id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
                email: { type: Sequelize.STRING(320), allowNull: false, unique: true },
                status: { type: Sequelize.ENUM('active', 'unsubscribed'), allowNull: false, defaultValue: 'active' },
                source: { type: Sequelize.STRING(100), allowNull: true },
                subscribed_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
                unsubscribed_at: { type: Sequelize.DATE, allowNull: true },
                created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
                updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
            }
        );
        await queryInterface.addIndex(
            { tableName: 'newsletter_subscribers', schema: 'imperialpedia' },
            ['status']
        );
    },
    async down(queryInterface) {
        await queryInterface.dropTable({ tableName: 'newsletter_subscribers', schema: 'imperialpedia' });
    },
};
