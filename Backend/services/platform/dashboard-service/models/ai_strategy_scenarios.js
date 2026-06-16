'use strict';
const { DataTypes } = require('sequelize');
// Strategic scenario playbooks (expand / acquire / merge / windDown). Editable reference payloads
// surfaced on the AI Strategy view. One row per (org_id, scenario).
module.exports = (sequelize) => sequelize.define('AiStrategyScenario', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    scenario: { type: DataTypes.STRING(30), allowNull: false, validate: { isIn: [['expand', 'acquire', 'merge', 'windDown']] } },
    payload: { type: DataTypes.JSONB, allowNull: true, defaultValue: {} },
}, { schema: 'dashboard', tableName: 'ai_strategy_scenarios', underscored: true, timestamps: true });
