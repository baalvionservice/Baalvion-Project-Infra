'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('BillingSubscription', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    plan: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'Pro' },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    annual_price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    billing_cycle: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'annually' },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'Active' },
    next_billing_date: { type: DataTypes.DATEONLY, allowNull: true },
    payment_method: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    contact: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    limits: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
    usage: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
}, { schema: 'dashboard', tableName: 'billing_subscriptions', underscored: true, timestamps: true });
