'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('DocFaq', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    question: { type: DataTypes.STRING(500), allowNull: false },
    answer: { type: DataTypes.TEXT, allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
}, { schema: 'dashboard', tableName: 'doc_faqs', underscored: true, timestamps: true });
