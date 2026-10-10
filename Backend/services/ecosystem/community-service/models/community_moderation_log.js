'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('CommunityModerationLog', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    community_id: { type: DataTypes.UUID, allowNull: true },
    actor_user_id: { type: DataTypes.UUID, allowNull: false },
    action: { type: DataTypes.STRING(80), allowNull: false },
    target_user_id: { type: DataTypes.UUID, allowNull: true },
    target_entity_type: { type: DataTypes.STRING(40), allowNull: true },
    target_entity_id: { type: DataTypes.STRING(80), allowNull: true },
    details: { type: DataTypes.JSONB, allowNull: true },
}, {
    tableName: 'community_moderation_logs',
    schema: 'community',
    underscored: true,
    timestamps: true,
    updatedAt: false,
});
