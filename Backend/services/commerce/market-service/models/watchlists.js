'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Watchlist = sequelize.define('Watchlist', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        name: { type: DataTypes.STRING(200), allowNull: false },
        description: { type: DataTypes.TEXT },
        is_default: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, {
        sequelize,
        modelName: 'Watchlist',
        tableName: 'watchlists',
        schema: 'market',
        underscored: true,
        timestamps: true,
    });
    return Watchlist;
};
