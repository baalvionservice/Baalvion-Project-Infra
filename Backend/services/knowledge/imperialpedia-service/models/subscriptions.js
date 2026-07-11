'use strict';
const { DataTypes } = require('sequelize');

// Per-user premium subscription. Activated ONLY by the signature-verified Razorpay webhook
// (never by the client) — see service/payments.js verifyWebhook.
module.exports = (sequelize) => sequelize.define('subscriptions', {
    id:                  { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id:             { type: DataTypes.UUID, allowNull: false },
    plan_id:             { type: DataTypes.UUID, allowNull: false },
    billing_cycle:       { type: DataTypes.ENUM('monthly', 'annual'), allowNull: false, defaultValue: 'monthly' },
    status:              { type: DataTypes.ENUM('pending', 'active', 'canceled', 'past_due'), allowNull: false, defaultValue: 'pending' },
    current_period_end:  { type: DataTypes.DATE },
}, { schema: 'imperialpedia', tableName: 'subscriptions' });
