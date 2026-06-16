'use strict';
const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('DocHelpArticle', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    org_id: { type: DataTypes.UUID, allowNull: false },
    slug: { type: DataTypes.STRING(150), allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    category: { type: DataTypes.STRING(255), allowNull: true },
    reading_time: { type: DataTypes.STRING(50), allowNull: true },
    last_updated: { type: DataTypes.DATEONLY, allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: true },
}, { schema: 'dashboard', tableName: 'doc_help_articles', underscored: true, timestamps: true });
