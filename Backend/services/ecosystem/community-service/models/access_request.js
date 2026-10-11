'use strict';
const { DataTypes } = require('sequelize');

// A member asking to join a department or team. Approving records the decision; staff permissions themselves are granted in Staff.
module.exports = (sequelize) => sequelize.define('AccessRequest', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.STRING(64), allowNull: false },
    department: { type: DataTypes.STRING(40), allowNull: false },
    message: { type: DataTypes.STRING(600), allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'approved', 'declined', 'withdrawn'), allowNull: false, defaultValue: 'pending' },
    decided_by: { type: DataTypes.STRING(64), allowNull: true },
    decided_at: { type: DataTypes.DATE, allowNull: true },
    decision_note: { type: DataTypes.STRING(300), allowNull: true },
    requester_label: { type: DataTypes.STRING(120), allowNull: true },
}, {
    tableName: 'access_requests',
    schema: 'community',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['status'] }, { fields: ['user_id'] }],
});
