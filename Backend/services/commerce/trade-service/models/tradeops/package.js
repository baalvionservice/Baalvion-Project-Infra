'use strict';
// Logistics Core Foundation (Phase 1) — physical package/cargo unit inside a
// shipment (and optionally a container). Registered as db.LogisticsPackage to
// avoid ambiguity with the Node "package" concept. Schema `tradeops`, UUID PK,
// paranoid, versioned.
module.exports = (sequelize, DataTypes) => {
    const LogisticsPackage = sequelize.define('LogisticsPackage', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        shipment_id: { type: DataTypes.UUID, allowNull: false },
        container_id: { type: DataTypes.UUID },
        package_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'box',
            validate: {
                isIn: [[
                    'box', 'pallet', 'container', 'loose_cargo',
                    'hazardous', 'oversized', 'temperature_controlled',
                ]],
            },
        },
        length_cm: { type: DataTypes.DECIMAL(10, 2) },
        width_cm: { type: DataTypes.DECIMAL(10, 2) },
        height_cm: { type: DataTypes.DECIMAL(10, 2) },
        weight_kg: { type: DataTypes.DECIMAL(12, 3) },
        volume_cbm: { type: DataTypes.DECIMAL(12, 4) },
        barcode: { type: DataTypes.TEXT },
        qr_code: { type: DataTypes.TEXT },
        rfid_tag: { type: DataTypes.TEXT },
        sku: { type: DataTypes.TEXT },
        hs_code: { type: DataTypes.TEXT },
        commodity_description: { type: DataTypes.TEXT },
        packaging_material: { type: DataTypes.TEXT },
        seal_number: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'packages',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    LogisticsPackage.associate = (db) => {
        LogisticsPackage.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
        LogisticsPackage.belongsTo(db.Container, { as: 'container', foreignKey: 'container_id' });
    };

    return LogisticsPackage;
};
