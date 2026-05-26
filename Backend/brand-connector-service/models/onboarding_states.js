'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('onboarding_states', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    user_id: { type: DataTypes.INTEGER, allowNull: false },
    step: { type: DataTypes.INTEGER, defaultValue: 0 },
    data: { type: DataTypes.JSONB, defaultValue: {} },
    completed: { type: DataTypes.BOOLEAN, defaultValue: false },
    completed_at: { type: DataTypes.DATE, allowNull: true },
}, {
    schema: 'brand',
    tableName: 'onboarding_states',
    timestamps: true,
    underscored: true,
});
