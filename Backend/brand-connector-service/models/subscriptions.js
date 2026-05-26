'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('subscriptions', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    plan_id: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.STRING(30), defaultValue: 'trialing' },
    current_period_start: { type: DataTypes.DATE, allowNull: true },
    current_period_end: { type: DataTypes.DATE, allowNull: true },
    cancel_at_period_end: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
    schema: 'brand',
    tableName: 'subscriptions',
    timestamps: true,
    underscored: true,
});
