'use strict';
const { DataTypes } = require('sequelize');

/**
 * Idempotent payment ledger. One row per settled provider webhook event.
 *
 * The UNIQUE (provider, provider_event_id) constraint is the HARD dedup guarantee:
 * a replayed/duplicate webhook can never write a second ledger row, so payments
 * are never double-counted. The ledger row + the GatewayPayment status update are
 * written in ONE transaction, so state stays consistent.
 */
module.exports = (sequelize) =>
    sequelize.define(
        'PaymentLedgerEntry',
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
            websiteSlug: { type: DataTypes.STRING(190), allowNull: false, field: 'website_slug' },
            gatewayPaymentId: { type: DataTypes.UUID, allowNull: true, field: 'gateway_payment_id' },
            provider: { type: DataTypes.STRING(40), allowNull: false },
            providerEventId: { type: DataTypes.STRING(190), allowNull: false, field: 'provider_event_id' },
            eventType: { type: DataTypes.STRING(60), allowNull: false, field: 'event_type' },
            direction: { type: DataTypes.ENUM('credit', 'debit'), allowNull: false, defaultValue: 'credit' },
            amount: { type: DataTypes.DECIMAL(19, 4), allowNull: false, comment: 'minor units' },
            currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'INR' },
            status: { type: DataTypes.STRING(30), allowNull: false },
            traceId: { type: DataTypes.STRING(120), allowNull: true, field: 'trace_id' },
            payload: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        },
        {
            sequelize,
            modelName: 'PaymentLedgerEntry',
            tableName: 'payment_ledger_entries',
            schema: 'payments',
            timestamps: true,
            underscored: true,
            indexes: [
                // THE dedup guarantee — one ledger row per provider event, PER TENANT.
                // website_slug is in the key so two tenants on the same provider can't
                // collide on a shared provider event id (which would silently drop one
                // tenant's real payment as a "duplicate").
                { unique: true, fields: ['website_slug', 'provider', 'provider_event_id'], name: 'uq_ledger_tenant_provider_event' },
                { fields: ['gateway_payment_id'], name: 'idx_ledger_payment' },
                { fields: ['website_slug', 'created_at'], name: 'idx_ledger_tenant_date' },
            ],
        },
    );
