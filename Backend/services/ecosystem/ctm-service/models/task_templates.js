'use strict';
const { DataTypes } = require('sequelize');

// Reusable task blueprints a company can load into the task-creation form.
module.exports = (sequelize) => sequelize.define('task_templates', {
    id:               { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    company_id:       { type: DataTypes.UUID, allowNull: false },
    created_by:       { type: DataTypes.BIGINT },
    title:            { type: DataTypes.STRING(300), allowNull: false },
    description:      { type: DataTypes.TEXT },
    role_category:    { type: DataTypes.STRING(80) },
    difficulty:       { type: DataTypes.ENUM('easy', 'medium', 'hard', 'expert'), defaultValue: 'medium' },
    task_types:       { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
    instructions:     { type: DataTypes.TEXT },
    expected_outputs: { type: DataTypes.TEXT },
    time_limit_minutes:{ type: DataTypes.INTEGER },
    multi_round:      { type: DataTypes.BOOLEAN, defaultValue: false },
    rounds:           { type: DataTypes.JSONB, defaultValue: [] },
    is_private:       { type: DataTypes.BOOLEAN, defaultValue: false },
    metadata:         { type: DataTypes.JSONB, defaultValue: {} },
}, { schema: 'ctm', tableName: 'task_templates' });
