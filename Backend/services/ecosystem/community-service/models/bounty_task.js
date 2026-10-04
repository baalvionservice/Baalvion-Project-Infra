'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('BountyTask', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    title: { type: DataTypes.STRING(200), allowNull: false },
    target: { type: DataTypes.STRING(300), allowNull: false },
    difficulty: { type: DataTypes.ENUM('EASY', 'MEDIUM', 'HARD', 'EXPERT'), allowNull: false },
    reward_label: { type: DataTypes.STRING(80), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    rules: { type: DataTypes.TEXT, allowNull: true },
    status: { type: DataTypes.ENUM('draft', 'open', 'closed'), allowNull: false, defaultValue: 'draft' },
}, {
    tableName: 'bounty_tasks', schema: 'community', underscored: true, timestamps: true,
    indexes: [{ fields: ['status'] }],
});
