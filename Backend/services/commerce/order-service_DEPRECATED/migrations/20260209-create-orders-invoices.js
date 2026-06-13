'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable({ tableName: 'orders_invoices', schema: 'orders' }, {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
            order_id: { type: Sequelize.UUID, allowNull: false, unique: true },
            invoice_number: { type: Sequelize.STRING(50), allowNull: false, unique: true },
            status: { type: Sequelize.ENUM('draft', 'sent', 'paid', 'overdue', 'voided'), defaultValue: 'draft' },
            due_date: { type: Sequelize.DATE, allowNull: true },
            sent_at: { type: Sequelize.DATE, allowNull: true },
            paid_at: { type: Sequelize.DATE, allowNull: true },
            pdf_url: { type: Sequelize.STRING(500), allowNull: true },
            metadata: { type: Sequelize.JSONB, defaultValue: {} },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
        await queryInterface.addIndex({ tableName: 'orders_invoices', schema: 'orders' }, ['order_id']);
    },
    async down(queryInterface) { await queryInterface.dropTable({ tableName: 'orders_invoices', schema: 'orders' }); },
};
