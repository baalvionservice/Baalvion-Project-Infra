'use strict';
// Logistics Core Foundation (Phase 3) — itemized shipment cost ledger. Distinct
// from db.FreightQuote (trade.freight_quotes: a single carrier-quoted price
// before booking) — this is the post-booking, line-item breakdown (freight,
// customs duty, insurance premium, handling, ...) that "View Cost"/"Approve
// Cost" (LOGISTICS_PERMISSIONS.COST_VIEW/COST_APPROVE, Phase 1) operate on.
// Schema `tradeops`, UUID PK, paranoid, versioned.
module.exports = (sequelize, DataTypes) => {
    const ShipmentCharge = sequelize.define('ShipmentCharge', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        shipment_id: { type: DataTypes.UUID, allowNull: false },
        charge_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                isIn: [[
                    'freight', 'customs_duty', 'insurance_premium', 'handling',
                    'documentation', 'demurrage', 'detention', 'other',
                ]],
            },
        },
        description: { type: DataTypes.TEXT },
        amount: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
        currency: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'USD' },
        status: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'pending',
            validate: { isIn: [['pending', 'approved', 'invoiced', 'paid', 'disputed']] },
        },
        reference_type: { type: DataTypes.TEXT }, // e.g. 'freight_quote', 'insurance_policy', 'customs_submission'
        reference_id: { type: DataTypes.TEXT },
        approved_by: { type: DataTypes.TEXT },
        approved_at: { type: DataTypes.DATE },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'shipment_charges',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    ShipmentCharge.associate = (db) => {
        ShipmentCharge.belongsTo(db.TradeShipment, { as: 'shipment', foreignKey: 'shipment_id' });
    };

    return ShipmentCharge;
};
