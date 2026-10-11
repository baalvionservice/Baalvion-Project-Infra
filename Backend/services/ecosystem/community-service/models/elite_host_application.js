'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('EliteHostApplication', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.STRING(64), allowNull: false },
    host_alias: { type: DataTypes.STRING(80), allowNull: true },
    budget_inr: { type: DataTypes.BIGINT, allowNull: false },
    state: { type: DataTypes.STRING(80), allowNull: false },
    city: { type: DataTypes.STRING(80), allowNull: false },
    area: { type: DataTypes.STRING(80), allowNull: true },
    club_id: { type: DataTypes.STRING(80), allowNull: true },
    club_name: { type: DataTypes.STRING(160), allowNull: true },
    party_date: { type: DataTypes.DATEONLY, allowNull: true },
    guests: { type: DataTypes.INTEGER, allowNull: true },
    perks: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
    reviewed_by: { type: DataTypes.STRING(64), allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'elite_host_applications',
    schema: 'community',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['status'] }, { fields: ['user_id'] }],
});
