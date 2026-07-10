'use strict';
// Shipment Tracking & Global Visibility Platform — a shipment's planned/actual
// physical stop, with arrival/departure so dwell/delay/waiting time is
// queryable directly. Schema `tradeops`, UUID PK, paranoid, versioned.
module.exports = (sequelize, DataTypes) => {
    const ShipmentCheckpoint = sequelize.define('ShipmentCheckpoint', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        shipment_id: { type: DataTypes.UUID, allowNull: false },
        checkpoint_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { isIn: [['warehouse', 'factory', 'port', 'airport', 'rail_terminal', 'border', 'customs', 'distribution_center', 'delivery_hub', 'final_destination']] },
        },
        name: { type: DataTypes.TEXT },
        sequence: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        arrived_at: { type: DataTypes.DATE },
        departed_at: { type: DataTypes.DATE },
        delay_minutes: { type: DataTypes.INTEGER },
        waiting_minutes: { type: DataTypes.INTEGER },
        inspection_status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'pending',
            validate: { isIn: [['pending', 'passed', 'failed', 'not_applicable']] },
        },
        approved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        latitude: { type: DataTypes.DECIMAL(9, 6) },
        longitude: { type: DataTypes.DECIMAL(9, 6) },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'shipment_checkpoints',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    ShipmentCheckpoint.associate = (db) => {
        ShipmentCheckpoint.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
    };

    return ShipmentCheckpoint;
};
