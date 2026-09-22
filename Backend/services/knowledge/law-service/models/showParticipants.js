'use strict';
module.exports = (sequelize, DataTypes) =>
    sequelize.define('ShowParticipant', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        slug: { type: DataTypes.STRING(200), allowNull: false },
        show_slug: { type: DataTypes.STRING(200), allowNull: false },
        name: { type: DataTypes.STRING(200), allowNull: false },
        appearances: { type: DataTypes.JSONB, defaultValue: [] },
        known_for: { type: DataTypes.TEXT },
        overview: { type: DataTypes.TEXT, defaultValue: '' },
        facts: { type: DataTypes.JSONB, defaultValue: [] },
        faq: { type: DataTypes.JSONB, defaultValue: [] },
        sources: { type: DataTypes.JSONB, defaultValue: [] },
        seo_title: { type: DataTypes.STRING(200) },
        seo_description: { type: DataTypes.STRING(320) },
        reviewed_at: { type: DataTypes.DATE },
        indexable: { type: DataTypes.BOOLEAN, defaultValue: false },
        published: { type: DataTypes.BOOLEAN, defaultValue: true },
        archived: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, { schema: 'legal', tableName: 'show_participants', underscored: true, timestamps: true });
