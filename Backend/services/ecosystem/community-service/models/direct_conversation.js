'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('DirectConversation', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_a_id: { type: DataTypes.UUID, allowNull: false },
    user_b_id: { type: DataTypes.UUID, allowNull: false },
    context_label: { type: DataTypes.TEXT, allowNull: true },
    last_message_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'direct_conversations',
    schema: 'community',
    underscored: true,
    timestamps: true,
});
