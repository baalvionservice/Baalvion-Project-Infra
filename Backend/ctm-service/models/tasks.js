'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('tasks', {
    id:              { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    company_id:      { type: DataTypes.UUID, allowNull: false },
    created_by:      { type: DataTypes.BIGINT, allowNull: false },
    title:           { type: DataTypes.STRING(300), allowNull: false },
    description:     { type: DataTypes.TEXT },
    requirements:    { type: DataTypes.TEXT },
    tech_stack:      { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    difficulty:      { type: DataTypes.ENUM('easy', 'medium', 'hard', 'expert'), defaultValue: 'medium' },
    status:          { type: DataTypes.ENUM('draft', 'open', 'in_review', 'closed'), defaultValue: 'draft' },
    reward:          { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    currency:        { type: DataTypes.STRING(3), defaultValue: 'USD' },
    max_submissions: { type: DataTypes.INTEGER },
    deadline:        { type: DataTypes.DATE },
    tags:            { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    metadata:        { type: DataTypes.JSONB, defaultValue: {} },
}, { schema: 'ctm', tableName: 'tasks' });
