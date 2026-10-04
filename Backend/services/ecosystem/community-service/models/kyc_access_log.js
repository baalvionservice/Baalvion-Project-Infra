'use strict';
const { DataTypes } = require('sequelize');

// Who looked at or decided on a case, and when. Written on every document view.
module.exports = (sequelize) => sequelize.define('KycAccessLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    verification_id: { type: DataTypes.UUID, allowNull: false },
    admin_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.ENUM('view_id', 'view_selfie', 'approve', 'reject'), allowNull: false },
}, {
    tableName: 'kyc_access_log', schema: 'community', underscored: true, timestamps: true, updatedAt: false,
    indexes: [{ fields: ['verification_id'] }],
});
