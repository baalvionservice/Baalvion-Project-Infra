'use strict';
module.exports = (sequelize, DataTypes) => sequelize.define('InvestmentPreference', {
    investor_id: { type: DataTypes.UUID, primaryKey: true },
    industries: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
    stages: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
    geographies: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
    ticket_min: { type: DataTypes.DECIMAL(20, 2) },
    ticket_max: { type: DataTypes.DECIMAL(20, 2) },
    risk_appetite: { type: DataTypes.STRING(20) },
}, { schema: 'marketplace', tableName: 'investment_preferences', underscored: true, timestamps: false });
