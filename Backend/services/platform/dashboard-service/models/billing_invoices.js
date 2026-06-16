'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('BillingInvoice', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    invoice_key: { type: DataTypes.STRING(50), allowNull: false },
    period: { type: DataTypes.STRING(50), allowNull: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Paid' },
    payment_date: { type: DataTypes.DATEONLY, allowNull: true },
}, { schema: 'dashboard', tableName: 'billing_invoices', underscored: true, timestamps: true });
