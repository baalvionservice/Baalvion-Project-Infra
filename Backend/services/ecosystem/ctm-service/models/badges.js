'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('badges', {
    id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name:        { type: DataTypes.STRING(120), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    icon:        { type: DataTypes.STRING(500) },
    rarity:      { type: DataTypes.ENUM('Common', 'Rare', 'Elite'), defaultValue: 'Common' },
    criteria:    { type: DataTypes.JSONB, defaultValue: {} },
    is_active:   { type: DataTypes.BOOLEAN, defaultValue: true },
}, { schema: 'ctm', tableName: 'badges' });
