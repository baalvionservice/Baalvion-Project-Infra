'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('LocalApplication', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    listing_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.STRING(64), allowNull: false },
    full_name: { type: DataTypes.STRING(160), allowNull: false },
    phone: { type: DataTypes.STRING(32), allowNull: false },
    email: { type: DataTypes.STRING(320), allowNull: true },
    message: { type: DataTypes.TEXT, allowNull: true },
    details: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    status: { type: DataTypes.ENUM('pending', 'shortlisted', 'accepted', 'rejected', 'withdrawn'), allowNull: false, defaultValue: 'pending' },
}, {
    tableName: 'local_applications',
    schema: 'community',
    underscored: true,
    timestamps: true,
    indexes: [
        { unique: true, fields: ['listing_id', 'user_id'] },
        { fields: ['status'] },
    ],
});
