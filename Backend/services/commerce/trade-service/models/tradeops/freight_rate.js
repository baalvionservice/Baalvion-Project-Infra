'use strict';
// Freight Management — Rate Engine: resolved/cached rate line (Phase 3, Prompt 2).
// Schema `tradeops`, tenant-scoped (RLS + index.js hooks). Produced by applying
// freight_rate_rules to a lane/carrier/weight combo (source='rule_engine'), read
// off a carrier connector's own rate card (source='connector_rate_card'), or
// entered by an operator (source='manual'). See migration 048.
module.exports = (sequelize, DataTypes) => {
    const FreightRate = sequelize.define('FreightRate', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        carrier_id: { type: DataTypes.UUID },
        origin_code: { type: DataTypes.TEXT },
        destination_code: { type: DataTypes.TEXT },
        mode: { type: DataTypes.TEXT },
        base_rate: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
        fuel_pct: { type: DataTypes.DECIMAL(6, 4), allowNull: false, defaultValue: 0 },
        computed_rate: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
        currency: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'USD' },
        valid_until: { type: DataTypes.DATE },
        source: {
            type: DataTypes.TEXT,
            allowNull: false,
            defaultValue: 'rule_engine',
            validate: { isIn: [['rule_engine', 'connector_rate_card', 'manual']] },
        },
    }, {
        schema: 'tradeops',
        tableName: 'freight_rates',
        underscored: true,
        timestamps: true,
        updatedAt: 'updated_at',
    });

    FreightRate.associate = (db) => {
        if (db.CarrierDirectory) {
            FreightRate.belongsTo(db.CarrierDirectory, { as: 'carrier', foreignKey: 'carrier_id' });
        }
    };

    return FreightRate;
};
