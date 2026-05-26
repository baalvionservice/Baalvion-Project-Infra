'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const TechnicalIndicator = sequelize.define('TechnicalIndicator', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        symbol: { type: DataTypes.STRING(20), allowNull: false },
        timeframe: { type: DataTypes.STRING(10) },
        rsi: { type: DataTypes.DECIMAL(6, 2) },
        macd: { type: DataTypes.DECIMAL(10, 4) },
        macd_signal: { type: DataTypes.DECIMAL(10, 4) },
        sma_20: { type: DataTypes.DECIMAL(12, 4) },
        sma_50: { type: DataTypes.DECIMAL(12, 4) },
        sma_200: { type: DataTypes.DECIMAL(12, 4) },
        ema_20: { type: DataTypes.DECIMAL(12, 4) },
        bollinger_upper: { type: DataTypes.DECIMAL(12, 4) },
        bollinger_lower: { type: DataTypes.DECIMAL(12, 4) },
        volume_avg: { type: DataTypes.DECIMAL(20, 2) },
        trend: { type: DataTypes.ENUM('bullish', 'bearish', 'sideways'), defaultValue: 'sideways' },
        calculated_at: { type: DataTypes.DATE },
    }, {
        sequelize,
        modelName: 'TechnicalIndicator',
        tableName: 'technical_indicators',
        schema: 'market',
        underscored: true,
        timestamps: true,
        updatedAt: false,
        indexes: [
            { unique: true, fields: ['symbol', 'timeframe'] }
        ],
    });
    return TechnicalIndicator;
};
