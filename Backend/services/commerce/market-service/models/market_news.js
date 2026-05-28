'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MarketNews = sequelize.define('MarketNews', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        headline: { type: DataTypes.STRING(1000), allowNull: false },
        summary: { type: DataTypes.TEXT },
        source: { type: DataTypes.STRING(200) },
        url: { type: DataTypes.STRING(1000) },
        symbols: { type: DataTypes.JSONB, defaultValue: [] },
        categories: { type: DataTypes.JSONB, defaultValue: [] },
        sentiment: { type: DataTypes.ENUM('positive', 'negative', 'neutral'), defaultValue: 'neutral' },
        published_at: { type: DataTypes.DATE, allowNull: false },
    }, {
        sequelize,
        modelName: 'MarketNews',
        tableName: 'market_news',
        schema: 'market',
        underscored: true,
        timestamps: true,
        updatedAt: false,
    });
    return MarketNews;
};
