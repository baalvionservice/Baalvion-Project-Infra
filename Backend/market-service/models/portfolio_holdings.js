'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const PortfolioHolding = sequelize.define('PortfolioHolding', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        portfolio_id: { type: DataTypes.INTEGER, allowNull: false },
        symbol: { type: DataTypes.STRING(20), allowNull: false },
        name: { type: DataTypes.STRING(200) },
        asset_type: { type: DataTypes.STRING(50) },
        quantity: { type: DataTypes.DECIMAL(15, 6), allowNull: false },
        avg_buy_price: { type: DataTypes.DECIMAL(12, 4), allowNull: false },
        current_price: { type: DataTypes.DECIMAL(12, 4), defaultValue: 0 },
        current_value: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
        gain_loss: { type: DataTypes.DECIMAL(15, 2), defaultValue: 0 },
        gain_loss_pct: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
        last_updated_at: { type: DataTypes.DATE },
    }, {
        sequelize,
        modelName: 'PortfolioHolding',
        tableName: 'portfolio_holdings',
        schema: 'market',
        underscored: true,
        timestamps: true,
        indexes: [
            { unique: true, fields: ['portfolio_id', 'symbol'] }
        ],
    });
    return PortfolioHolding;
};
