'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Notification', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
    type: { type: DataTypes.STRING(50), allowNull: true },
    link: { type: DataTypes.STRING(500), allowNull: true },
}, { schema: 'dashboard', tableName: 'notifications', underscored: true, timestamps: true, updatedAt: false });
