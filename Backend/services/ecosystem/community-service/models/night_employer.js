'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('NightEmployer', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false, unique: true },
    business_name: { type: DataTypes.STRING(160), allowNull: false },
    contact_name: { type: DataTypes.STRING(120), allowNull: false },
    phone: { type: DataTypes.STRING(32), allowNull: false },
    website: { type: DataTypes.STRING(300), allowNull: true },
    instagram: { type: DataTypes.STRING(60), allowNull: true },
    city: { type: DataTypes.STRING(80), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'verified', 'rejected'), allowNull: false, defaultValue: 'pending' },
    review_note: { type: DataTypes.STRING(500), allowNull: true },
    reviewed_by: { type: DataTypes.UUID, allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'night_employers',
    schema: 'community',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['status'] }],
});
