'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('lead_notes', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    lead_id: { type: DataTypes.INTEGER, allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
}, {
    schema: 'brand',
    tableName: 'lead_notes',
    timestamps: true,
    underscored: true,
});
