'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const WatchlistItem = sequelize.define('WatchlistItem', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        watchlist_id: { type: DataTypes.INTEGER, allowNull: false },
        symbol: { type: DataTypes.STRING(20), allowNull: false },
        name: { type: DataTypes.STRING(200) },
        asset_type: { type: DataTypes.STRING(50) },
        current_price: { type: DataTypes.DECIMAL(12, 4), defaultValue: 0 },
        change_pct: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
        added_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        notes: { type: DataTypes.TEXT },
    }, {
        sequelize,
        modelName: 'WatchlistItem',
        tableName: 'watchlist_items',
        schema: 'market',
        underscored: true,
        timestamps: true,
        indexes: [
            { unique: true, fields: ['watchlist_id', 'symbol'] }
        ],
    });
    return WatchlistItem;
};
