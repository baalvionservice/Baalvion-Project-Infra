'use strict';
module.exports = (sequelize, DataTypes) =>
    sequelize.define('SportsCompetition', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(400), allowNull: false },
        sport: { type: DataTypes.STRING(100), defaultValue: 'Other' },
        level: { type: DataTypes.STRING(20), defaultValue: 'other' },
        country_code: DataTypes.STRING(2),
        description: { type: DataTypes.TEXT, defaultValue: '' },
        event_date: DataTypes.STRING(20),
        people_involved: { type: DataTypes.JSONB, defaultValue: [] },
        related_article_slugs: { type: DataTypes.JSONB, defaultValue: [] },
        videos: { type: DataTypes.JSONB, defaultValue: [] },
        verified: { type: DataTypes.BOOLEAN, defaultValue: false },
        source_note: DataTypes.TEXT,
        published: { type: DataTypes.BOOLEAN, defaultValue: false },
        indexable: { type: DataTypes.BOOLEAN, defaultValue: false },
        archived: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, { schema: 'legal', tableName: 'sports_competitions', underscored: true, timestamps: true });
