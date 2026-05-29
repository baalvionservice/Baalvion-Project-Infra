'use strict';
const { DataTypes } = require('sequelize');

// Platform notifications. user_id null = broadcast / admin-wide (e.g. user_signup,
// system_warning). related_entity mirrors the frontend Notification.relatedEntity shape.
module.exports = (sequelize) => sequelize.define('notifications', {
    id:             { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id:        { type: DataTypes.BIGINT },
    company_id:     { type: DataTypes.UUID },
    type:           { type: DataTypes.STRING(60), allowNull: false },
    priority:       { type: DataTypes.ENUM('High', 'Medium', 'Low'), defaultValue: 'Medium' },
    status:         { type: DataTypes.ENUM('Unread', 'Read', 'Resolved'), defaultValue: 'Unread' },
    title:          { type: DataTypes.STRING(300), allowNull: false },
    description:    { type: DataTypes.TEXT },
    related_entity: { type: DataTypes.JSONB, defaultValue: {} },
    metadata:       { type: DataTypes.JSONB, defaultValue: {} },
}, { schema: 'ctm', tableName: 'notifications' });
