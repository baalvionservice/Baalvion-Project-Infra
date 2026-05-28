'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('proposals', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    deal_id: { type: DataTypes.INTEGER, allowNull: false },
    company_name: { type: DataTypes.STRING(255), allowNull: false },
    total_price: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
    status: { type: DataTypes.STRING(30), defaultValue: 'draft' },
    deliverables: { type: DataTypes.JSONB, defaultValue: [] },
    pricing_breakdown: { type: DataTypes.JSONB, defaultValue: {} },
    notes: { type: DataTypes.TEXT, allowNull: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, {
    schema: 'brand',
    tableName: 'proposals',
    timestamps: true,
    underscored: true,
});
