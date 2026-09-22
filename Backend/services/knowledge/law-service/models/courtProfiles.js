'use strict';
module.exports = (sequelize, DataTypes) =>
    sequelize.define('CourtProfile', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(300), allowNull: false },
        level: { type: DataTypes.STRING(20), defaultValue: 'other' },
        country_code: DataTypes.STRING(2),
        description: { type: DataTypes.TEXT, defaultValue: '' },
        url: DataTypes.STRING(500),
        // The court whose rulings this one reviews on appeal -- optional,
        // one level at a time (walk it repeatedly for a full chain).
        appeals_from_court_slug: DataTypes.STRING(200),
        published: { type: DataTypes.BOOLEAN, defaultValue: false },
        indexable: { type: DataTypes.BOOLEAN, defaultValue: false },
        archived: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, { schema: 'legal', tableName: 'court_profiles', underscored: true, timestamps: true });
