'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('CorporateDeal', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    deal_key: { type: DataTypes.STRING(50), allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    type: { type: DataTypes.STRING(50), allowNull: true },
    stage: { type: DataTypes.STRING(50), allowNull: true },
    value: { type: DataTypes.STRING(50), allowNull: true },
    owner: { type: DataTypes.STRING(255), allowNull: true },
    started: { type: DataTypes.DATEONLY, allowNull: true },
    close_date: { type: DataTypes.DATEONLY, allowNull: true },
    completed_date: { type: DataTypes.DATEONLY, allowNull: true },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active', validate: { isIn: [['active', 'completed']] } },
    timeline: { type: DataTypes.JSONB, allowNull: true, defaultValue: [] },
}, { schema: 'dashboard', tableName: 'corporate_deals', underscored: true, timestamps: true });
