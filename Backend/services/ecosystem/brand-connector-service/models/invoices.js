'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('invoices', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    subscription_id: { type: DataTypes.INTEGER, allowNull: true },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    currency: { type: DataTypes.STRING(10), defaultValue: 'INR' },
    status: { type: DataTypes.STRING(30), defaultValue: 'pending' },
    plan_name: { type: DataTypes.STRING(100), allowNull: true },
    pdf_url: { type: DataTypes.STRING(500), allowNull: true },
}, {
    schema: 'brand',
    tableName: 'invoices',
    timestamps: true,
    underscored: true,
});
