'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Task', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'todo', validate: { isIn: [['todo', 'in_progress', 'done', 'blocked']] } },
    assignee_id: { type: DataTypes.INTEGER, allowNull: true },
    business_id: { type: DataTypes.INTEGER, allowNull: true },
    priority: { type: DataTypes.STRING(10), allowNull: true, defaultValue: 'Medium', validate: { isIn: [['High', 'Medium', 'Low']] } },
    due_date: { type: DataTypes.DATEONLY, allowNull: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, { schema: 'dashboard', tableName: 'tasks', underscored: true, timestamps: true });
