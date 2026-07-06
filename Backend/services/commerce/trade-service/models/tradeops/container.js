'use strict';
// Logistics Core Foundation (Phase 1) — shipping container. Schema `tradeops`,
// UUID PK, paranoid, versioned. Soft-referenced to carriers (TEXT, like
// TradeShipment.carrier_id) rather than FK-constrained, since Carrier is a
// global marketplace registry the tenant may not have onboarded a row for yet.
module.exports = (sequelize, DataTypes) => {
    const Container = sequelize.define('Container', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        shipment_id: { type: DataTypes.UUID },
        container_number: { type: DataTypes.TEXT, allowNull: false },
        iso_code: { type: DataTypes.TEXT }, // ISO 6346 size-type code, e.g. '22G1'
        container_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: '20ft',
            validate: {
                isIn: [[
                    '20ft', '40ft', '40hc', '45hc', 'lcl', 'fcl',
                    'reefer', 'tank', 'open_top', 'flat_rack',
                ]],
            },
        },
        seal_number: { type: DataTypes.TEXT },
        carrier_id: { type: DataTypes.TEXT },
        owner: { type: DataTypes.TEXT },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'empty',
            validate: {
                isIn: [[
                    'empty', 'loaded', 'sealed', 'in_transit',
                    'at_port', 'customs_hold', 'released', 'returned',
                ]],
            },
        },
        current_location: { type: DataTypes.TEXT },
        capacity_kg: { type: DataTypes.DECIMAL(16, 3) },
        weight_kg: { type: DataTypes.DECIMAL(16, 3) },
        temperature_c: { type: DataTypes.DECIMAL(6, 2) },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'containers',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    Container.associate = (db) => {
        Container.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
        Container.hasMany(db.LogisticsPackage, { as: 'packages', foreignKey: 'container_id' });
        Container.hasMany(db.TrackingEvent, { as: 'trackingEvents', foreignKey: 'container_id' });
    };

    return Container;
};
