'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('system_logs', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: true },
    event: { type: DataTypes.STRING(100), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
}, {
    schema: 'brand',
    tableName: 'system_logs',
    timestamps: true,
    underscored: true,
});
