'use strict';
// Vessel Sailing Schedules (migration 065) — the schedule itself: one ordered stop on
// a voyage. This is the row that answers "which ship is at / heading to this port, and
// when". ETA/ETD are the published plan; actual_arrival/actual_departure are what
// really happened, so delay is always the measured difference between the two rather
// than an assumed figure.
module.exports = (sequelize, DataTypes) => {
    const CALL_TYPES = ['load', 'discharge', 'both', 'transit'];
    const STATUSES = ['scheduled', 'arrived', 'working', 'departed', 'skipped', 'cancelled'];

    const VoyagePortCall = sequelize.define('VoyagePortCall', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        voyage_id: { type: DataTypes.UUID, allowNull: false },
        sequence: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        // UN/LOCODE (e.g. INNSA, AEJEA) — the same key the GCKB port registry uses,
        // so a call resolves to a real port record with coordinates.
        port_code: { type: DataTypes.TEXT, allowNull: false },
        port_name: { type: DataTypes.TEXT },
        country_code: { type: DataTypes.TEXT },
        terminal: { type: DataTypes.TEXT },
        call_type: {
            type: DataTypes.TEXT, allowNull: false, defaultValue: 'both',
            validate: { isIn: [CALL_TYPES] },
        },
        eta: { type: DataTypes.DATE },
        etd: { type: DataTypes.DATE },
        actual_arrival: { type: DataTypes.DATE },
        actual_departure: { type: DataTypes.DATE },
        status: {
            type: DataTypes.TEXT, allowNull: false, defaultValue: 'scheduled',
            validate: { isIn: [STATUSES] },
        },
        // Latest time cargo can be delivered to the terminal for this sailing.
        cutoff_at: { type: DataTypes.DATE },
        data_source: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'manual' },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'voyage_port_calls',
        underscored: true,
        timestamps: true,
    });

    VoyagePortCall.CALL_TYPES = CALL_TYPES;
    VoyagePortCall.STATUSES = STATUSES;

    VoyagePortCall.associate = (db) => {
        VoyagePortCall.belongsTo(db.Voyage, { as: 'voyage', foreignKey: 'voyage_id' });
    };

    return VoyagePortCall;
};
