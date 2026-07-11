'use strict';
const { DataTypes } = require('sequelize');

// Payment transactions (Razorpay). provider_ref holds the gateway order id; raw keeps the
// last-known gateway payload for support/debugging (no secrets are ever stored here).
module.exports = (sequelize) => sequelize.define('payments', {
    id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id:         { type: DataTypes.UUID, allowNull: false },
    subscription_id: { type: DataTypes.UUID },
    provider:        { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'razorpay' },
    provider_ref:    { type: DataTypes.STRING(200) },
    amount:          { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
    currency:        { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
    status:          { type: DataTypes.ENUM('pending', 'succeeded', 'failed', 'refunded'), allowNull: false, defaultValue: 'pending' },
    raw:             { type: DataTypes.JSONB, defaultValue: {} },
}, { schema: 'imperialpedia', tableName: 'payments' });
