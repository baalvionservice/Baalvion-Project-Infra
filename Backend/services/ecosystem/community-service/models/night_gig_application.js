'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('NightGigApplication', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    gig_id: { type: DataTypes.UUID, allowNull: false },
    profile_id: { type: DataTypes.UUID, allowNull: false },
    note: { type: DataTypes.STRING(1000), allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'shortlisted', 'hired', 'rejected', 'withdrawn'), allowNull: false, defaultValue: 'pending' },
}, {
    tableName: 'night_gig_applications',
    schema: 'community',
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ['gig_id', 'profile_id'] }, { fields: ['profile_id'] }],
});
