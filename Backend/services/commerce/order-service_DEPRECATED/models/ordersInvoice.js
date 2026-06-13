'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('OrdersInvoice', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        orderId: { type: DataTypes.UUID, allowNull: false, unique: true },
        invoiceNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        status: { type: DataTypes.ENUM('draft', 'sent', 'paid', 'overdue', 'voided'), defaultValue: 'draft' },
        dueDate: { type: DataTypes.DATE, allowNull: true },
        sentAt: { type: DataTypes.DATE, allowNull: true },
        paidAt: { type: DataTypes.DATE, allowNull: true },
        pdfUrl: { type: DataTypes.STRING(500), allowNull: true },
        metadata: { type: DataTypes.JSONB, defaultValue: {} },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'orders_invoices' });
};
