'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('team_members', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    name: { type: DataTypes.STRING(255), allowNull: true },
    email: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(30), defaultValue: 'viewer' },
    status: { type: DataTypes.STRING(30), defaultValue: 'invited' },
    joined_at: { type: DataTypes.DATE, allowNull: true },
}, {
    schema: 'brand',
    tableName: 'team_members',
    timestamps: true,
    underscored: true,
});
