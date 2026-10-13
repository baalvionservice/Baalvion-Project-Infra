'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('ForumTopic', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    community_id: { type: DataTypes.UUID, allowNull: false },
    author_user_id: { type: DataTypes.STRING(64), allowNull: false },
    author_name: { type: DataTypes.STRING(120), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    thread_type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'discussion' },
    is_answered: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    accepted_pid: { type: DataTypes.INTEGER, allowNull: true },
    is_pinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_locked: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    views: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    post_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    last_post_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    last_post_by: { type: DataTypes.STRING(120), allowNull: true },
}, { tableName: 'forum_topics', schema: 'community', underscored: true, timestamps: true });
