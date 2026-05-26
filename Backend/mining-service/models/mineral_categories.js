'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MineralCategory = sequelize.define('MineralCategory', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        icon_url: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'mineral_categories',
        schema: 'mining',
        underscored: true,
        timestamps: true,
    });

    return MineralCategory;
};
