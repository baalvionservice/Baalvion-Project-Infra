'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Announcement', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING(160), allowNull: false },
    body: { type: DataTypes.STRING(1000), allowNull: false },
    severity: { type: DataTypes.ENUM('info', 'warning', 'critical'), allowNull: false, defaultValue: 'info' },
    link_url: { type: DataTypes.STRING(300), allowNull: true },
    starts_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    ends_at: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM('draft', 'published', 'archived'), allowNull: false, defaultValue: 'draft' },
    created_by: { type: DataTypes.UUID, allowNull: false },
}, { tableName: 'announcements', schema: 'community', underscored: true, timestamps: true, indexes: [{ fields: ['status', 'starts_at'] }] });
