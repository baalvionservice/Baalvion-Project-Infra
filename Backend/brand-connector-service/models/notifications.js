'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('notifications', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    org_id: { type: DataTypes.UUID, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
    type: { type: DataTypes.STRING(60), allowNull: true },
    link: { type: DataTypes.STRING(500), allowNull: true },
    related_id: { type: DataTypes.INTEGER, allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: true },
}, {
    schema: 'brand',
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
});
