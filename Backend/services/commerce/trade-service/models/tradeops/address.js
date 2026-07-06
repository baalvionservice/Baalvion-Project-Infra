'use strict';
// Logistics Core Foundation (Phase 1) — general-purpose logistics address book
// (pickup/delivery/warehouse/port/airport/rail/billing points). Distinct from
// db.VerifiedAddress, which is KYC onboarding evidence for a company's
// registered/factory address, not an operational shipment address. Registered
// as db.LogisticsAddress. Schema `tradeops`, UUID PK, paranoid, versioned.
module.exports = (sequelize, DataTypes) => {
    const LogisticsAddress = sequelize.define('LogisticsAddress', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        address_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'pickup',
            validate: {
                isIn: [[
                    'pickup', 'delivery', 'warehouse', 'port',
                    'airport', 'rail_terminal', 'billing', 'company',
                ]],
            },
        },
        company_name: { type: DataTypes.TEXT },
        contact_name: { type: DataTypes.TEXT },
        contact_phone: { type: DataTypes.TEXT },
        line1: { type: DataTypes.TEXT, allowNull: false },
        line2: { type: DataTypes.TEXT },
        city: { type: DataTypes.TEXT, allowNull: false },
        state_province: { type: DataTypes.TEXT },
        postal_code: { type: DataTypes.TEXT },
        country_code: { type: DataTypes.TEXT, allowNull: false }, // ISO 3166-1 alpha-2
        latitude: { type: DataTypes.DECIMAL(9, 6) },
        longitude: { type: DataTypes.DECIMAL(9, 6) },
        timezone: { type: DataTypes.TEXT },
        validated_at: { type: DataTypes.DATE },
        validation_source: { type: DataTypes.TEXT },
        metadata: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'logistics_addresses',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
        version: true,
    });

    LogisticsAddress.associate = (db) => {
        LogisticsAddress.hasMany(db.TradeShipment, { as: 'pickupShipments', foreignKey: 'pickup_address_id' });
        LogisticsAddress.hasMany(db.TradeShipment, { as: 'deliveryShipments', foreignKey: 'delivery_address_id' });
    };

    return LogisticsAddress;
};
