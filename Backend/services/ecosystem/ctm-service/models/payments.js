'use strict';
const { DataTypes } = require('sequelize');

// Payment transactions across providers (Stripe/Razorpay/...). provider_ref holds the
// gateway object id (checkout session / payment intent / order). raw keeps the payload.
module.exports = (sequelize) => sequelize.define('payments', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    company_id:     { type: DataTypes.UUID, allowNull: false },
    subscription_id:{ type: DataTypes.UUID },
    invoice_id:     { type: DataTypes.UUID },
    provider:       { type: DataTypes.STRING(30), defaultValue: 'manual' },
    provider_ref:   { type: DataTypes.STRING(200) },
    amount:         { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    currency:       { type: DataTypes.STRING(3), defaultValue: 'USD' },
    status:         { type: DataTypes.ENUM('pending', 'requires_action', 'succeeded', 'failed', 'refunded'), defaultValue: 'pending' },
    checkout_url:   { type: DataTypes.TEXT },
    raw:            { type: DataTypes.JSONB, defaultValue: {} },
}, { schema: 'ctm', tableName: 'payments' });
