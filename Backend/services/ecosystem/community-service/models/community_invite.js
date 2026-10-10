'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('CommunityInvite', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    community_id: { type: DataTypes.UUID, allowNull: false },
    invited_by_user_id: { type: DataTypes.UUID, allowNull: false },
    invited_email: { type: DataTypes.STRING(320), allowNull: true },
    token: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    status: {
        type: DataTypes.ENUM('pending', 'redeemed', 'revoked', 'expired'),
        allowNull: false,
        defaultValue: 'pending',
    },
    expires_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'community_invites',
    schema: 'community',
    underscored: true,
    timestamps: true,
});
