'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('evaluations', {
    id:            { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    submission_id: { type: DataTypes.UUID, allowNull: false, unique: true },
    evaluator_id:  { type: DataTypes.BIGINT, allowNull: false },
    score:         { type: DataTypes.DECIMAL(5, 2), allowNull: false },
    feedback:      { type: DataTypes.TEXT },
    criteria:      { type: DataTypes.JSONB, defaultValue: {} },
    is_final:      { type: DataTypes.BOOLEAN, defaultValue: false },
}, { schema: 'ctm', tableName: 'evaluations' });
