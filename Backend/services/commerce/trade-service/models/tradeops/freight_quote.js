'use strict';
// Freight Management — persisted quote request envelope (Phase 3, Prompt 2). Schema
// `tradeops`, tenant-scoped (RLS + index.js hooks). Distinct from the legacy
// `trade.freight_quotes` (order-driven single-carrier upsert behind /shipping_quotes,
// kept live) — this covers any origin/destination/cargo request, persists every
// candidate carrier's priced option (freight_quote_items) and comparison score
// (freight_comparisons), and is what a future freight_bookings row traces back to
// via `quote_id`. Registered as `FreightQuoteRequest` (not `FreightQuote`) to avoid
// colliding with the legacy db.FreightQuote (schema `trade`, string PK). See
// migration 049.
module.exports = (sequelize, DataTypes) => {
    const FreightQuote = sequelize.define('FreightQuoteRequest', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        shipment_id: { type: DataTypes.UUID },
        trade_operation_id: { type: DataTypes.UUID },
        origin: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        destination: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        cargo: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        incoterm: { type: DataTypes.TEXT },
        transport_mode: { type: DataTypes.TEXT },
        preferred_carrier_id: { type: DataTypes.UUID },
        requested_pickup: { type: DataTypes.DATEONLY },
        requested_delivery: { type: DataTypes.DATEONLY },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'draft',
            validate: { isIn: [['draft', 'quoted', 'expired', 'converted']] },
        },
        valid_until: { type: DataTypes.DATE },
        engine_version: { type: DataTypes.TEXT },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'freight_quotes',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
    });

    FreightQuote.associate = (db) => {
        if (db.TradeOperation) {
            FreightQuote.belongsTo(db.TradeOperation, { as: 'tradeOperation', foreignKey: 'trade_operation_id' });
        }
        if (db.CarrierDirectory) {
            FreightQuote.belongsTo(db.CarrierDirectory, { as: 'preferredCarrier', foreignKey: 'preferred_carrier_id' });
        }
        if (db.FreightQuoteItem) {
            FreightQuote.hasMany(db.FreightQuoteItem, { as: 'items', foreignKey: 'quote_id' });
        }
        if (db.FreightComparison) {
            FreightQuote.hasMany(db.FreightComparison, { as: 'comparisons', foreignKey: 'quote_id' });
        }
        if (db.FreightBooking) {
            FreightQuote.hasMany(db.FreightBooking, { as: 'bookings', foreignKey: 'quote_id' });
        }
    };

    return FreightQuote;
};
