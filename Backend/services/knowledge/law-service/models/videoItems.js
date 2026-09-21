'use strict';
module.exports = (sequelize, DataTypes) =>
    sequelize.define('VideoItem', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
        title: { type: DataTypes.STRING(300), allowNull: false },
        description: { type: DataTypes.TEXT, defaultValue: '' },
        video_url: { type: DataTypes.TEXT, allowNull: false },
        thumbnail_url: { type: DataTypes.TEXT },
        thumbnail_credit: { type: DataTypes.TEXT },
        source_name: { type: DataTypes.STRING(200) },
        show_slug: { type: DataTypes.STRING(200) },
        category: { type: DataTypes.STRING(60) },
        scope: { type: DataTypes.STRING(15), defaultValue: 'national' },
        country_code: { type: DataTypes.STRING(10) },
        duration_seconds: { type: DataTypes.INTEGER },
        published_at: { type: DataTypes.DATE },
        people_slugs: { type: DataTypes.JSONB, defaultValue: [] },
        sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
        featured: { type: DataTypes.BOOLEAN, defaultValue: false },
        published: { type: DataTypes.BOOLEAN, defaultValue: false },
        archived: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, { schema: 'legal', tableName: 'video_items', underscored: true, timestamps: true });
