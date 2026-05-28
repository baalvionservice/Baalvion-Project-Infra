'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Trade = sequelize.define('Trade', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        portfolio_id: { type: DataTypes.INTEGER, allowNull: false },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        symbol: { type: DataTypes.STRING(20), allowNull: false },
        name: { type: DataTypes.STRING(200) },
        asset_type: { type: DataTypes.STRING(50) },
        trade_type: { type: DataTypes.ENUM('buy', 'sell'), allowNull: false },
        quantity: { type: DataTypes.DECIMAL(15, 6), allowNull: false },
        price: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
        total_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: false },
        fees: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        currency: { type: DataTypes.STRING(10), defaultValue: 'USD' },
        exchange: { type: DataTypes.STRING(50) },
        notes: { type: DataTypes.TEXT },
        traded_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    }, {
        sequelize,
        modelName: 'Trade',
        tableName: 'trades',
        schema: 'market',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });
    return Trade;
};
