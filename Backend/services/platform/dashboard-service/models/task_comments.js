'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('TaskComment', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    task_id: { type: DataTypes.INTEGER, allowNull: false },
    author_id: { type: DataTypes.INTEGER, allowNull: true },
    text: { type: DataTypes.TEXT, allowNull: false },
}, { schema: 'dashboard', tableName: 'task_comments', underscored: true, timestamps: true });
