'use strict';
const { DataTypes } = require('sequelize');

// Subscription plans (Free/Pro/Enterprise). Price is the SOURCE OF TRUTH for checkout — the
// frontend's displayed price must always match `monthly_price`/`annual_price` here, since the
// server computes the charge amount from this row and never trusts a client-sent amount.
module.exports = (sequelize) => sequelize.define('plans', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tier_key:       { type: DataTypes.STRING(50), allowNull: false, unique: true }, // matches SubscriptionTier.id (tier-free/tier-pro/tier-enterprise)
    name:           { type: DataTypes.STRING(100), allowNull: false },
    monthly_price:  { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    annual_price:   { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    currency:       { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    is_active:      { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { schema: 'imperialpedia', tableName: 'plans' });
