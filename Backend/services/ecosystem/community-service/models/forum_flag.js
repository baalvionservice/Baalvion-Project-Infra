'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('ForumFlag', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    post_id: { type: DataTypes.INTEGER, allowNull: false },
    reporter_user_id: { type: DataTypes.STRING(64), allowNull: false },
    reason: { type: DataTypes.STRING(1000), allowNull: false },
    state: { type: DataTypes.STRING(12), allowNull: false, defaultValue: 'open' },
}, { tableName: 'forum_flags', schema: 'community', underscored: true, timestamps: true });
