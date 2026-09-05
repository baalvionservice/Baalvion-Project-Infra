'use strict';
// Vessel Sailing Schedules (migration 065) — the physical ship. IMO number is the
// permanent, globally-unique identifier (a vessel keeps it even when renamed or
// re-flagged), so it's the natural key for reconciling records from different sources.
module.exports = (sequelize, DataTypes) => {
    const VESSEL_TYPES = [
        'container', 'bulk_carrier', 'tanker', 'roro', 'general_cargo', 'reefer', 'lng_carrier', 'other',
    ];

    const Vessel = sequelize.define('Vessel', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        imo_number: { type: DataTypes.TEXT, unique: true },
        mmsi: { type: DataTypes.TEXT },
        name: { type: DataTypes.TEXT, allowNull: false },
        vessel_type: {
            type: DataTypes.TEXT, allowNull: false, defaultValue: 'container',
            validate: { isIn: [VESSEL_TYPES] },
        },
        flag_country: { type: DataTypes.TEXT },
        operator_name: { type: DataTypes.TEXT },
        carrier_code: { type: DataTypes.TEXT },
        capacity_teu: { type: DataTypes.INTEGER },
        deadweight_tons: { type: DataTypes.INTEGER },
        // Service speed drives the distance-based transit estimate when a lane has no
        // published schedule to read the real dates from.
        service_speed_knots: { type: DataTypes.DECIMAL(5, 2) },
        year_built: { type: DataTypes.INTEGER },
        // Where this record came from: a carrier API, a bulk import, or manual entry.
        data_source: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'manual' },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'vessels',
        underscored: true,
        timestamps: true,
    });

    Vessel.VESSEL_TYPES = VESSEL_TYPES;

    Vessel.associate = (db) => {
        Vessel.hasMany(db.Voyage, { as: 'voyages', foreignKey: 'vessel_id' });
    };

    return Vessel;
};
