'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('deals', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    lead_id: { type: DataTypes.INTEGER, allowNull: true },
    company_name: { type: DataTypes.STRING(255), allowNull: false },
    value: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    stage: { type: DataTypes.STRING(40), defaultValue: 'new' },
    assigned_to: { type: DataTypes.INTEGER, allowNull: true },
    source: { type: DataTypes.STRING(40), defaultValue: 'manual' },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, {
    schema: 'brand',
    tableName: 'deals',
    timestamps: true,
    underscored: true,
});
