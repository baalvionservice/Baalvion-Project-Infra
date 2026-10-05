'use strict';
const { DataTypes } = require('sequelize');

// Records that a user accepted the program rules, and which version, before they can report.
module.exports = (sequelize) => sequelize.define('BountyParticipant', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    rules_version: { type: DataTypes.STRING(20), allowNull: false },
    accepted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'bounty_participants', schema: 'community', underscored: true, timestamps: false });
