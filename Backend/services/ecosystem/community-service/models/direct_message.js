'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('DirectMessage', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    conversation_id: { type: DataTypes.UUID, allowNull: false },
    sender_id: { type: DataTypes.UUID, allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    read_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'direct_messages',
    schema: 'community',
    underscored: true,
    timestamps: true,
});
