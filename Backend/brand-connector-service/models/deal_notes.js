'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('deal_notes', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    deal_id: { type: DataTypes.INTEGER, allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
}, {
    schema: 'brand',
    tableName: 'deal_notes',
    timestamps: true,
    underscored: true,
});
