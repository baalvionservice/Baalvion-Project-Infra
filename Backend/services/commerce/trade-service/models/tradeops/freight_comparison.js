'use strict';
// Freight Management — persisted freight comparison scoring snapshot (Phase 3,
// Prompt 2). Schema `tradeops`, tenant-scoped (RLS + index.js hooks). One row per
// (quote, carrier): snapshots the multi-dimension scoring the spec calls for
// (price/transit/reliability/capacity/carbon/insurance/tracking quality/pickup
// availability/delivery accuracy/cancellation policy) plus the blended
// `overall_score` and its `rank` among the quote's candidates. See migration 049.
module.exports = (sequelize, DataTypes) => {
    const FreightComparison = sequelize.define('FreightComparison', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        quote_id: { type: DataTypes.UUID, allowNull: false },
        carrier_id: { type: DataTypes.UUID },
        price_score: { type: DataTypes.DECIMAL(6, 4) },
        transit_score: { type: DataTypes.DECIMAL(6, 4) },
        reliability_score: { type: DataTypes.DECIMAL(6, 4) },
        capacity_score: { type: DataTypes.DECIMAL(6, 4) },
        carbon_score: { type: DataTypes.DECIMAL(6, 4) },
        insurance_score: { type: DataTypes.DECIMAL(6, 4) },
        tracking_quality_score: { type: DataTypes.DECIMAL(6, 4) },
        pickup_availability_score: { type: DataTypes.DECIMAL(6, 4) },
        delivery_accuracy_score: { type: DataTypes.DECIMAL(6, 4) },
        cancellation_policy_score: { type: DataTypes.DECIMAL(6, 4) },
        overall_score: { type: DataTypes.DECIMAL(6, 4) },
        rank: { type: DataTypes.INTEGER },
    }, {
        schema: 'tradeops',
        tableName: 'freight_comparisons',
        underscored: true,
        timestamps: true,
        updatedAt: false, // append-only scoring snapshot
    });

    FreightComparison.associate = (db) => {
        FreightComparison.belongsTo(db.FreightQuoteRequest, { as: 'quote', foreignKey: 'quote_id' });
        if (db.CarrierDirectory) {
            FreightComparison.belongsTo(db.CarrierDirectory, { as: 'carrier', foreignKey: 'carrier_id' });
        }
    };

    return FreightComparison;
};
