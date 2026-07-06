'use strict';
// Logistics Core Foundation (Phase 3) — return merchandise authorization (RMA)
// against a delivered shipment. Registered as db.ShipmentReturn to avoid
// colliding with the reserved word `return`. Schema `tradeops`, UUID PK,
// paranoid, versioned.
module.exports = (sequelize, DataTypes) => {
    const ShipmentReturn = sequelize.define('ShipmentReturn', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        shipment_id: { type: DataTypes.UUID, allowNull: false },
        rma_number: { type: DataTypes.TEXT },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { isIn: [['damaged', 'wrong_item', 'quality_issue', 'customer_request', 'other']] },
        },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'requested',
            validate: { isIn: [['requested', 'approved', 'in_transit', 'received', 'refunded', 'rejected']] },
        },
        quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
        requested_by: { type: DataTypes.TEXT },
        requested_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        approved_at: { type: DataTypes.DATE },
        received_at: { type: DataTypes.DATE },
        refund_amount: { type: DataTypes.DECIMAL(20, 2) },
        notes: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'shipment_returns',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    ShipmentReturn.associate = (db) => {
        ShipmentReturn.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
    };

    return ShipmentReturn;
};
