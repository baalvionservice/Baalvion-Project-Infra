'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Page = sequelize.define('Page', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        created_by: { type: DataTypes.BIGINT, allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        slug: { type: DataTypes.STRING(500), allowNull: false, unique: true },
        content: { type: DataTypes.TEXT, allowNull: true },
        meta_title: { type: DataTypes.STRING(500), allowNull: true },
        meta_description: { type: DataTypes.TEXT, allowNull: true },
        page_type: {
            type: DataTypes.STRING(100),
            defaultValue: 'general',
            validate: { isIn: [['general', 'landing', 'legal', 'blog']] }
        },
        status: {
            type: DataTypes.STRING(32),
            defaultValue: 'draft',
            validate: { isIn: [['draft', 'published', 'archived']] }
        },
        order_index: { type: DataTypes.INTEGER, defaultValue: 0 },
        is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
        published_at: { type: DataTypes.DATE, allowNull: true },
        views_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    }, {
        tableName: 'pages',
        schema: 'about',
        underscored: true,
        timestamps: true,
    });
    return Page;
};
