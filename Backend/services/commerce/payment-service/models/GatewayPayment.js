'use strict';
const { DataTypes } = require('sequelize');

/**
 * A gateway checkout payment (Razorpay/Stripe/PayU) for a tenant (website slug).
 * Distinct from the interbank `Transaction` model — this is the website-checkout
 * vertical. UNIQUE (website_slug, idempotency_key) makes create idempotent.
 */
module.exports = (sequelize) =>
    sequelize.define(
        'GatewayPayment',
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
            websiteSlug: { type: DataTypes.STRING(190), allowNull: false, field: 'website_slug' },
            provider: { type: DataTypes.STRING(40), allowNull: false },
            providerOrderId: { type: DataTypes.STRING(190), allowNull: true, field: 'provider_order_id' },
            providerPaymentId: { type: DataTypes.STRING(190), allowNull: true, field: 'provider_payment_id' },
            idempotencyKey: { type: DataTypes.STRING(120), allowNull: false, field: 'idempotency_key' },
            amount: { type: DataTypes.DECIMAL(19, 4), allowNull: false, comment: 'minor units' },
            currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'INR' },
            status: {
                type: DataTypes.ENUM('created', 'authorized', 'captured', 'failed', 'refunded'),
                allowNull: false,
                defaultValue: 'created',
            },
            receipt: { type: DataTypes.STRING(190), allowNull: true },
            metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
            traceId: { type: DataTypes.STRING(120), allowNull: true, field: 'trace_id' },
        },
        {
            sequelize,
            modelName: 'GatewayPayment',
            tableName: 'gateway_payments',
            schema: 'payments',
            timestamps: true,
            underscored: true,
            indexes: [
                { unique: true, fields: ['website_slug', 'idempotency_key'], name: 'uq_gwpay_tenant_idem' },
                { fields: ['provider', 'provider_order_id'], name: 'idx_gwpay_provider_order' },
                { fields: ['provider', 'provider_payment_id'], name: 'idx_gwpay_provider_payment' },
                { fields: ['website_slug', 'status'], name: 'idx_gwpay_tenant_status' },
            ],
        },
    );
