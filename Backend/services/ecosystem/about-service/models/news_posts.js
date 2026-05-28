'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const NewsPost = sequelize.define('NewsPost', {
        id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
        author_id: { type: DataTypes.BIGINT, allowNull: false },
        title: { type: DataTypes.STRING(500), allowNull: false },
        slug: { type: DataTypes.STRING(500), allowNull: false, unique: true },
        excerpt: { type: DataTypes.TEXT, allowNull: true },
        content: { type: DataTypes.TEXT, allowNull: true },
        cover_image_url: { type: DataTypes.TEXT, allowNull: true },
        category: {
            type: DataTypes.STRING(100),
            defaultValue: 'news',
            validate: { isIn: [['news', 'blog', 'press', 'announcement']] }
        },
        tags: { type: DataTypes.JSONB, defaultValue: [] },
        status: {
            type: DataTypes.STRING(32),
            defaultValue: 'draft',
            validate: { isIn: [['draft', 'published', 'archived']] }
        },
        is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
        published_at: { type: DataTypes.DATE, allowNull: true },
        views_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        read_time_minutes: { type: DataTypes.INTEGER, defaultValue: 3 },
    }, {
        tableName: 'news_posts',
        schema: 'about',
        underscored: true,
        timestamps: true,
    });
    return NewsPost;
};
