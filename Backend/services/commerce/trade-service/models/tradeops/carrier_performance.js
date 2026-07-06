'use strict';
// Freight Management — periodic carrier performance aggregate (Phase 3, Prompt 2).
// Schema `tradeops`, GLOBAL reference data (no tenant_id — a carrier's track record
// is platform-wide, like carriers itself). Populated by the
// freight_carrier_performance_refresh BullMQ job (queue/index.js +
// service/freight/carrierPerformance.js), never computed per-request. Denormalizes
// into carriers.performance_score. See migration 050.
module.exports = (sequelize, DataTypes) => {
    const CarrierPerformance = sequelize.define('CarrierPerformance', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        carrier_id: { type: DataTypes.UUID, allowNull: false },
        period_start: { type: DataTypes.DATE, allowNull: false },
        period_end: { type: DataTypes.DATE, allowNull: false },
        bookings_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        on_time_pct: { type: DataTypes.DECIMAL(5, 2) },
        avg_transit_days: { type: DataTypes.DECIMAL(6, 2) },
        eta_accuracy_pct: { type: DataTypes.DECIMAL(5, 2) },
        damage_incident_rate: { type: DataTypes.DECIMAL(6, 4) },
        cancellation_rate: { type: DataTypes.DECIMAL(6, 4) },
        avg_rating: { type: DataTypes.DECIMAL(3, 2) },
        computed_score: { type: DataTypes.DECIMAL(5, 2) },
    }, {
        schema: 'tradeops',
        tableName: 'carrier_performance',
        underscored: true,
        timestamps: true,
        updatedAt: false, // append-only per-period snapshot
    });

    CarrierPerformance.associate = (db) => {
        if (db.CarrierDirectory) {
            CarrierPerformance.belongsTo(db.CarrierDirectory, { as: 'carrier', foreignKey: 'carrier_id' });
        }
    };

    return CarrierPerformance;
};
