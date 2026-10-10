'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('CommunityChatMessage', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    community_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.UUID, allowNull: false },
    username: { type: DataTypes.STRING(120), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
}, {
    tableName: 'community_chat_messages',
    schema: 'community',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['community_id', 'created_at'] }],
});
