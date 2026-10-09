'use strict';
const { DataTypes } = require('sequelize');

// In-app notification feed (the site's bell). One row per event per user.
module.exports = (sequelize) => sequelize.define('UserNotification', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false },
    type: { type: DataTypes.STRING(40), allowNull: false },
    title: { type: DataTypes.STRING(200), allowNull: false },
    body: { type: DataTypes.STRING(1000), allowNull: false },
    action_url: { type: DataTypes.STRING(300), allowNull: true },
    read_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'user_notifications', schema: 'community', underscored: true, timestamps: true, updatedAt: false,
    indexes: [{ fields: ['user_id', 'created_at'] }],
});
