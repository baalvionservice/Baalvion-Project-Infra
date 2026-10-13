'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('ForumPost', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    topic_id: { type: DataTypes.INTEGER, allowNull: false },
    author_user_id: { type: DataTypes.STRING(64), allowNull: false },
    author_name: { type: DataTypes.STRING(120), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    edited_at: { type: DataTypes.DATE, allowNull: true },
    removed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
}, { tableName: 'forum_posts', schema: 'community', underscored: true, timestamps: true });
