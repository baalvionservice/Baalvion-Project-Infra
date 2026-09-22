'use strict';
module.exports = (sequelize, DataTypes) =>
    sequelize.define('CaseProfile', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
        case_name: { type: DataTypes.STRING(400), allowNull: false },
        // Optional: a case can exist the moment something newsworthy
        // happens (e.g. an arrest) before any court is on record.
        court_slug: { type: DataTypes.STRING(200), allowNull: true },
        jurisdiction: { type: DataTypes.STRING(300), defaultValue: '' },
        country_code: DataTypes.STRING(2),
        status: { type: DataTypes.STRING(20), defaultValue: 'concluded' },
        summary: { type: DataTypes.TEXT, defaultValue: '' },
        parties: { type: DataTypes.JSONB, defaultValue: [] },
        lawyers: { type: DataTypes.JSONB, defaultValue: [] },
        judges: { type: DataTypes.JSONB, defaultValue: [] },
        important_dates: { type: DataTypes.JSONB, defaultValue: [] },
        timeline: { type: DataTypes.JSONB, defaultValue: [] },
        documents: { type: DataTypes.JSONB, defaultValue: [] },
        related_article_slugs: { type: DataTypes.JSONB, defaultValue: [] },
        seo_title: DataTypes.STRING(200),
        seo_description: DataTypes.STRING(400),
        verified: { type: DataTypes.BOOLEAN, defaultValue: false },
        source_note: DataTypes.TEXT,
        last_reviewed_at: DataTypes.DATE,
        published: { type: DataTypes.BOOLEAN, defaultValue: false },
        indexable: { type: DataTypes.BOOLEAN, defaultValue: false },
        archived: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, { schema: 'legal', tableName: 'case_profiles', underscored: true, timestamps: true });
