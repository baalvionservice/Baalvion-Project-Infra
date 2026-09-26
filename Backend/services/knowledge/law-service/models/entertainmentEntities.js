'use strict';
module.exports = (sequelize, DataTypes) =>
    sequelize.define('EntertainmentEntity', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
        title: { type: DataTypes.STRING(400), allowNull: false },
        type: { type: DataTypes.STRING(30), allowNull: false },
        release_date: DataTypes.STRING(20),
        description: { type: DataTypes.TEXT, defaultValue: '' },
        people_involved: { type: DataTypes.JSONB, defaultValue: [] },
        related_entities: { type: DataTypes.JSONB, defaultValue: [] },
        related_article_slugs: { type: DataTypes.JSONB, defaultValue: [] },
        videos: { type: DataTypes.JSONB, defaultValue: [] },
        interviews: { type: DataTypes.JSONB, defaultValue: [] },
        seo_title: DataTypes.STRING(200),
        seo_description: DataTypes.STRING(400),
        verified: { type: DataTypes.BOOLEAN, defaultValue: false },
        source_note: DataTypes.TEXT,
        last_reviewed_at: DataTypes.DATE,
        published: { type: DataTypes.BOOLEAN, defaultValue: false },
        indexable: { type: DataTypes.BOOLEAN, defaultValue: false },
        archived: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, { schema: 'legal', tableName: 'entertainment_entities', underscored: true, timestamps: true });
