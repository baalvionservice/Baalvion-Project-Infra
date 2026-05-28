'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Skill = sequelize.define('Skill', {
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
        category: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },
    }, {
        tableName: 'skills',
        schema: 'jobs',
        underscored: true,
        timestamps: true,
    });

    return Skill;
};
