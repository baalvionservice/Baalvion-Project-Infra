'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('CommunityJoinRequest', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    community_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
    reviewed_by_user_id: { type: DataTypes.UUID, allowNull: true },
    reviewed_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'community_join_requests',
    schema: 'community',
    underscored: true,
    timestamps: true,
    updatedAt: false,
});
