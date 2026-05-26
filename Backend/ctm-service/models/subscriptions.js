'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('subscriptions', {
    id:                     { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    company_id:             { type: DataTypes.UUID, allowNull: false },
    plan_id:                { type: DataTypes.UUID, allowNull: false },
    status:                 { type: DataTypes.ENUM('active', 'cancelled', 'expired', 'trialing', 'past_due'), defaultValue: 'active' },
    billing_cycle:          { type: DataTypes.ENUM('monthly', 'annual'), defaultValue: 'monthly' },
    current_period_start:   { type: DataTypes.DATE },
    current_period_end:     { type: DataTypes.DATE },
    gateway:                { type: DataTypes.STRING(50) },
    gateway_subscription_id:{ type: DataTypes.STRING(200) },
    amount:                 { type: DataTypes.DECIMAL(12, 2) },
    currency:               { type: DataTypes.STRING(3), defaultValue: 'USD' },
    cancelled_at:           { type: DataTypes.DATE },
    trial_ends_at:          { type: DataTypes.DATE },
}, { schema: 'ctm', tableName: 'subscriptions' });
