'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Community', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    slug: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(160), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    access_model: {
        type: DataTypes.ENUM('free', 'invite_only', 'request_approval', 'paid'),
        allowNull: false,
        defaultValue: 'free',
    },
    nodebb_cid: { type: DataTypes.INTEGER, allowNull: true },
    nodebb_group_member: { type: DataTypes.STRING(160), allowNull: true },
    nodebb_group_paid: { type: DataTypes.STRING(160), allowNull: true },
    nodebb_group_mod: { type: DataTypes.STRING(160), allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    price_usd_cents: { type: DataTypes.INTEGER, allowNull: true },
    is_platform_tier: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, {
    tableName: 'communities',
    schema: 'community',
    underscored: true,
    timestamps: true,
});
