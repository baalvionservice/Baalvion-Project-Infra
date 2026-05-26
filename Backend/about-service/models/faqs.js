'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Faq = sequelize.define('Faq', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        question: { type: DataTypes.TEXT, allowNull: false },
        answer: { type: DataTypes.TEXT, allowNull: false },
        category: { type: DataTypes.STRING(100), defaultValue: 'general' },
        order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
        is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
        helpful_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    }, {
        tableName: 'faqs',
        schema: 'about',
        underscored: true,
        timestamps: true,
    });
    return Faq;
};
