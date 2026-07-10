'use strict';
// Freight Management — carrier coverage: country / lane / port-pair a carrier
// serves (Phase 3, Prompt 2). Schema `tradeops`, GLOBAL reference data (child of
// carriers — no tenant_id, same rationale as its parent). See migration 047.
module.exports = (sequelize, DataTypes) => {
    const CarrierRegion = sequelize.define('CarrierRegion', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        carrier_id: { type: DataTypes.UUID, allowNull: false },
        region_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { isIn: [['country', 'lane', 'port_pair']] },
        },
        origin_code: { type: DataTypes.TEXT },
        destination_code: { type: DataTypes.TEXT },
        active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    }, {
        schema: 'tradeops',
        tableName: 'carrier_regions',
        underscored: true,
        timestamps: true,
    });

    CarrierRegion.associate = (db) => {
        if (db.CarrierDirectory) {
            CarrierRegion.belongsTo(db.CarrierDirectory, { as: 'carrier', foreignKey: 'carrier_id' });
        }
    };

    return CarrierRegion;
};
