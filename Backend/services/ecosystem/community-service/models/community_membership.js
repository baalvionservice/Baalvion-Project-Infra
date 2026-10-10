'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('CommunityMembership', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    community_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    role: { type: DataTypes.ENUM('member', 'moderator', 'admin'), allowNull: false, defaultValue: 'member' },
    status: {
        type: DataTypes.ENUM('invited', 'requested', 'approved', 'paid', 'rejected', 'banned', 'cancelled', 'expired'),
        allowNull: false,
        defaultValue: 'requested',
    },
    tier: { type: DataTypes.STRING(40), allowNull: true },
    amount_usd: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
    currency: { type: DataTypes.STRING(10), allowNull: true },
    payment_ref: { type: DataTypes.STRING(160), allowNull: true },
    started_at: { type: DataTypes.DATE, allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'community_memberships',
    schema: 'community',
    underscored: true,
    timestamps: true,
    indexes: [{ unique: true, fields: ['community_id', 'user_id'] }],
});
