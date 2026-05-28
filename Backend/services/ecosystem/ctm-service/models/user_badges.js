'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('user_badges', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id:     { type: DataTypes.BIGINT, allowNull: false },
    badge_id:    { type: DataTypes.UUID, allowNull: false },
    awarded_at:  { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    awarded_for: { type: DataTypes.TEXT },
}, { schema: 'ctm', tableName: 'user_badges' });
