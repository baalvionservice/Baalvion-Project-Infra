'use strict';
const { DataTypes } = require('sequelize');

// Where to email a signed-in user. Filled from the email claim in their own token whenever they
// use the site, so notifications can reach people without a user-directory lookup.
module.exports = (sequelize) => sequelize.define('NotificationContact', {
    user_id: { type: DataTypes.UUID, primaryKey: true },
    email: { type: DataTypes.STRING(320), allowNull: false },
}, { tableName: 'notification_contacts', schema: 'community', underscored: true, timestamps: true, createdAt: false });
