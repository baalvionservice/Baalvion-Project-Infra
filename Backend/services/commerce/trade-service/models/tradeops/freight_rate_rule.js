'use strict';
// Freight Management — Rate Engine: persisted, admin-editable pricing rule (Phase 3,
// Prompt 2). Schema `tradeops`, tenant-scoped (RLS + index.js hooks) — a tenant's
// negotiated contract/discount rates are private. Rules stack by `priority` (lower
// number resolves first); service/freight/rateEngine.js applies them in order to a
// lane/carrier/weight/volume combo. See migration 048.
module.exports = (sequelize, DataTypes) => {
    const FreightRateRule = sequelize.define('FreightRateRule', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        rule_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { isIn: [['lane', 'weight', 'volume', 'seasonal', 'peak', 'contract', 'country', 'discount', 'markup']] },
        },
        carrier_id: { type: DataTypes.UUID },
        origin_code: { type: DataTypes.TEXT },
        destination_code: { type: DataTypes.TEXT },
        mode: { type: DataTypes.TEXT },
        min_weight_kg: { type: DataTypes.DECIMAL(20, 3) },
        max_weight_kg: { type: DataTypes.DECIMAL(20, 3) },
        min_volume_cbm: { type: DataTypes.DECIMAL(20, 3) },
        max_volume_cbm: { type: DataTypes.DECIMAL(20, 3) },
        valid_from: { type: DataTypes.DATEONLY },
        valid_to: { type: DataTypes.DATEONLY },
        currency: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'USD' },
        adjustment_type: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { isIn: [['flat', 'percent', 'per_kg', 'per_cbm']] },
        },
        adjustment_value: { type: DataTypes.DECIMAL(20, 4), allowNull: false },
        priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 100 },
        active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
        created_by: { type: DataTypes.TEXT },
        updated_by: { type: DataTypes.TEXT },
        deleted_by: { type: DataTypes.TEXT },
    }, {
        schema: 'tradeops',
        tableName: 'freight_rate_rules',
        underscored: true,
        timestamps: true,
        paranoid: true,
        deletedAt: 'deleted_at',
    });

    FreightRateRule.associate = (db) => {
        if (db.CarrierDirectory) {
            FreightRateRule.belongsTo(db.CarrierDirectory, { as: 'carrier', foreignKey: 'carrier_id' });
        }
    };

    return FreightRateRule;
};
