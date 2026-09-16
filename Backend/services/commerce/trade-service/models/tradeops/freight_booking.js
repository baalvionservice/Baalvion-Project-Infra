'use strict';
// Freight Marketplace Integration Layer (Prompt 10) — a tracked freight booking.
// Schema `tradeops`, UUID PK, tenant-scoped (RLS + index.js hooks). The status column
// walks the booking lifecycle (booking → booked/failed → confirmed → in_transit →
// delivered/cancelled). The selected carrier + quote + tracking are the normalized
// projection of whichever carrier (DHL/FedEx/UPS/Maersk) confirmed; `quotes` snapshots
// the full ranked marketplace and `carriers_attempted` records the fallback trail.
// See migration 016 + service/freight/.
module.exports = (sequelize, DataTypes) => {
    const FreightBooking = sequelize.define('FreightBooking', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        order_id: { type: DataTypes.TEXT },
        shipment_id: { type: DataTypes.UUID },
        trade_operation_id: { type: DataTypes.UUID },
        quote_id: { type: DataTypes.UUID }, // links back to the persisted freight_quotes row (Phase 3, Prompt 2), if any
        carrier: {
            type: DataTypes.TEXT,
            // Which carriers exist is the Carrier Directory's business (migration 047),
            // not this model's — a coded connector and a directory-onboarded one are
            // equally bookable. The shape stays constrained so this remains a carrier
            // code rather than free text. See migration 085.
            validate: { is: /^[a-z0-9][a-z0-9_-]{1,31}$/ },
        },
        service_level: { type: DataTypes.TEXT },
        mode: {
            type: DataTypes.TEXT,
            validate: { isIn: [['express', 'air', 'ocean', 'road']] },
        },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'booking',
            validate: { isIn: [['draft', 'booking', 'booked', 'confirmed', 'in_transit', 'delivered', 'cancelled', 'failed']] },
        },
        origin: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        destination: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        request: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        quotes: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },      // ranked marketplace snapshot
        selected_quote: { type: DataTypes.JSONB },                                   // the winning quote
        chargeable_weight_kg: { type: DataTypes.DECIMAL(20, 3) },
        amount: { type: DataTypes.DECIMAL(20, 2) },
        currency: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'USD' },
        tracking_number: { type: DataTypes.TEXT },
        gateway_reference: { type: DataTypes.TEXT },
        label_url: { type: DataTypes.TEXT },
        estimated_delivery: { type: DataTypes.TEXT },                                // ISO date (from ETA engine)
        carriers_attempted: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] }, // fallback trail
        attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        max_fallbacks: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
        messages: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        last_error: { type: DataTypes.TEXT },
        failure_kind: {
            type: DataTypes.TEXT,
            validate: { isIn: [['validation', 'transient', 'permanent']] },
        },
        idempotency_key: { type: DataTypes.TEXT },
        engine_version: { type: DataTypes.TEXT },
        booked_at: { type: DataTypes.DATE },
        completed_at: { type: DataTypes.DATE },
        created_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'freight_bookings',
        underscored: true,
        timestamps: true,
    });

    FreightBooking.associate = (db) => {
        if (db.TradeOperation) {
            FreightBooking.belongsTo(db.TradeOperation, { as: 'tradeOperation', foreignKey: 'trade_operation_id' });
        }
        if (db.FreightBookingEvent) {
            FreightBooking.hasMany(db.FreightBookingEvent, { as: 'events', foreignKey: 'booking_id' });
        }
        if (db.FreightQuoteRequest) {
            FreightBooking.belongsTo(db.FreightQuoteRequest, { as: 'quote', foreignKey: 'quote_id' });
        }
    };

    return FreightBooking;
};
