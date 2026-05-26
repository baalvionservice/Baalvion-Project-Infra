'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('payments', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    proposal_id: { type: DataTypes.INTEGER, allowNull: true },
    deal_id: { type: DataTypes.INTEGER, allowNull: true },
    company_name: { type: DataTypes.STRING(255), allowNull: false },
    amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
    status: { type: DataTypes.STRING(30), defaultValue: 'pending' },
    method: { type: DataTypes.STRING(30), allowNull: true },
    transaction_id: { type: DataTypes.STRING(255), allowNull: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
}, {
    schema: 'brand',
    tableName: 'payments',
    timestamps: true,
    underscored: true,
});
