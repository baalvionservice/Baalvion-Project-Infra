'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Portfolio = sequelize.define('Portfolio', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        org_id: { type: DataTypes.UUID },
        name: { type: DataTypes.STRING(200), allowNull: false },
        description: { type: DataTypes.TEXT },
        currency: { type: DataTypes.STRING(10), defaultValue: 'USD' },
        initial_value: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
        current_value: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
        cash_balance: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
        total_gain_loss: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
        total_gain_loss_pct: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
        is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, {
        sequelize,
        modelName: 'Portfolio',
        tableName: 'portfolios',
        schema: 'market',
        underscored: true,
        timestamps: true,
    });
    return Portfolio;
};
