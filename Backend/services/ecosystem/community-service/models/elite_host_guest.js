'use strict';
const { DataTypes } = require('sequelize');

// A member asking to come to an approved Elite party, with how many guests they bring.
module.exports = (sequelize) => sequelize.define('EliteHostGuest', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    party_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.STRING(64), allowNull: false },
    requester_label: { type: DataTypes.STRING(120), allowNull: true },
    males: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    females: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    note: { type: DataTypes.STRING(300), allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'approved', 'declined', 'withdrawn'), allowNull: false, defaultValue: 'pending' },
    decided_by: { type: DataTypes.STRING(64), allowNull: true },
    decided_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'elite_host_guests',
    schema: 'community',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['party_id'] }, { fields: ['user_id'] }, { fields: ['status'] }],
});
