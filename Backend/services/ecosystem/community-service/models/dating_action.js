'use strict';
const { DataTypes } = require('sequelize');

// One member's like or pass on another. Two likes in opposite directions make a match.
module.exports = (sequelize) => sequelize.define('DatingAction', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    from_user: { type: DataTypes.STRING(64), allowNull: false },
    to_user: { type: DataTypes.STRING(64), allowNull: false },
    action: { type: DataTypes.STRING(8), allowNull: false },
}, { tableName: 'dating_actions', schema: 'community', underscored: true, timestamps: true, indexes: [{ unique: true, fields: ['from_user', 'to_user'] }, { fields: ['to_user', 'action'] }] });
