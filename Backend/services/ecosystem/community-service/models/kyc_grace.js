'use strict';
const { DataTypes } = require('sequelize');

// The 7 days a new member has to verify their identity. When it runs out without a KYC submission the account is blocked
// until the team approves a new access request.
module.exports = (sequelize) => sequelize.define('KycGrace', {
    user_id: { type: DataTypes.STRING(64), primaryKey: true },
    started_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deadline_at: { type: DataTypes.DATE, allowNull: false },
    state: { type: DataTypes.ENUM('open', 'blocked'), allowNull: false, defaultValue: 'open' },
    blocked_at: { type: DataTypes.DATE, allowNull: true },
    renewals: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { tableName: 'kyc_grace', schema: 'community', underscored: true, timestamps: true });
