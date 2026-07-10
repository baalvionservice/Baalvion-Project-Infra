'use strict';
// Freight Management — one priced carrier option within a freight_quote (Phase 3,
// Prompt 2). Schema `tradeops`, tenant-scoped (RLS + index.js hooks). Carries the
// full charge breakdown (freight/fuel/terminal/handling/customs/insurance/tax) the
// spec calls for, beyond the marketplace comparison engine's fuel-only surcharges.
// See migration 049.
module.exports = (sequelize, DataTypes) => {
    const FreightQuoteItem = sequelize.define('FreightQuoteItem', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        tenant_id: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'T-DEMO' },
        quote_id: { type: DataTypes.UUID, allowNull: false },
        carrier_id: { type: DataTypes.UUID },
        service_level: { type: DataTypes.TEXT },
        base_freight: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
        fuel_surcharge: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
        terminal_charge: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
        handling_charge: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
        customs_charge: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
        insurance_estimate: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
        tax_estimate: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
        total_amount: { type: DataTypes.DECIMAL(20, 2), allowNull: false, defaultValue: 0 },
        currency: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'USD' },
        transit_days: { type: DataTypes.INTEGER },
        carbon_estimate_kg: { type: DataTypes.DECIMAL(20, 2) },
        rank_cheapest: { type: DataTypes.INTEGER },
        rank_fastest: { type: DataTypes.INTEGER },
        rank_best: { type: DataTypes.INTEGER },
        selected: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    }, {
        schema: 'tradeops',
        tableName: 'freight_quote_items',
        underscored: true,
        timestamps: true,
    });

    FreightQuoteItem.associate = (db) => {
        FreightQuoteItem.belongsTo(db.FreightQuoteRequest, { as: 'quote', foreignKey: 'quote_id' });
        if (db.CarrierDirectory) {
            FreightQuoteItem.belongsTo(db.CarrierDirectory, { as: 'carrier', foreignKey: 'carrier_id' });
        }
    };

    return FreightQuoteItem;
};
