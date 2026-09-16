'use strict';
// Vessel Sailing Schedules (migration 065) — one sailing of a vessel. The voyage
// number is unique per vessel (a carrier reuses numbers across its fleet), which is
// why the uniqueness constraint is (vessel_id, voyage_number) rather than the number
// alone.
module.exports = (sequelize, DataTypes) => {
    const STATUSES = ['scheduled', 'in_transit', 'completed', 'cancelled', 'delayed'];

    const Voyage = sequelize.define('Voyage', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        vessel_id: { type: DataTypes.UUID, allowNull: false },
        voyage_number: { type: DataTypes.TEXT, allowNull: false },
        // The liner service this sailing belongs to, e.g. a carrier's named loop.
        service_name: { type: DataTypes.TEXT },
        direction: { type: DataTypes.TEXT },
        status: {
            type: DataTypes.TEXT, allowNull: false, defaultValue: 'scheduled',
            validate: { isIn: [STATUSES] },
        },
        // Denormalized first/last call for cheap lane filtering; the authoritative
        // sequence lives in voyage_port_calls.
        origin_port_code: { type: DataTypes.TEXT },
        destination_port_code: { type: DataTypes.TEXT },
        departure_date: { type: DataTypes.DATE },
        arrival_date: { type: DataTypes.DATE },
        data_source: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'manual' },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'voyages',
        underscored: true,
        timestamps: true,
    });

    Voyage.STATUSES = STATUSES;

    Voyage.associate = (db) => {
        Voyage.belongsTo(db.Vessel, { as: 'vessel', foreignKey: 'vessel_id' });
        Voyage.hasMany(db.VoyagePortCall, { as: 'portCalls', foreignKey: 'voyage_id' });
    };

    return Voyage;
};
