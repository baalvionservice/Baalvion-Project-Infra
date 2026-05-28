'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('automation_rules', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    event_trigger: { type: DataTypes.STRING(100), allowNull: false },
    conditions: { type: DataTypes.JSONB, defaultValue: {} },
    actions: { type: DataTypes.JSONB, defaultValue: [] },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    schema: 'brand',
    tableName: 'automation_rules',
    timestamps: true,
    underscored: true,
});
