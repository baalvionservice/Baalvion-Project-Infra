'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Notification', {
    id:           { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    org_id:       { type: DataTypes.UUID, allowNull: false },
    user_id:      { type: DataTypes.BIGINT, allowNull: true },
    candidate_id: { type: DataTypes.BIGINT, allowNull: true },
    title:        { type: DataTypes.STRING(255), allowNull: false },
    message:      { type: DataTypes.TEXT, allowNull: true },
    type:         { type: DataTypes.STRING(16), defaultValue: 'INFO', validate: { isIn: [['INFO', 'SUCCESS', 'WARNING', 'ERROR']] } },
    read:         { type: DataTypes.BOOLEAN, defaultValue: false },
    link:         { type: DataTypes.STRING(500), allowNull: true },
}, { schema: 'jobs', tableName: 'notifications', underscored: true, timestamps: true });
