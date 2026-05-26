'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Permission', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    module: { type: DataTypes.STRING(100), allowNull: false },
    access: { type: DataTypes.STRING(20), allowNull: false, validate: { isIn: [['read', 'write', 'admin']] } },
}, {
    schema: 'dashboard',
    tableName: 'permissions',
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ['org_id', 'user_id', 'module'] }],
});
