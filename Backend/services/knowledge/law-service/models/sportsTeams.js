'use strict';
module.exports = (sequelize, DataTypes) =>
    sequelize.define('SportsTeam', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(300), allowNull: false },
        sport: { type: DataTypes.STRING(100), defaultValue: 'Other' },
        country_code: DataTypes.STRING(2),
        description: { type: DataTypes.TEXT, defaultValue: '' },
        url: DataTypes.STRING(500),
        verified: { type: DataTypes.BOOLEAN, defaultValue: false },
        source_note: DataTypes.TEXT,
        published: { type: DataTypes.BOOLEAN, defaultValue: false },
        indexable: { type: DataTypes.BOOLEAN, defaultValue: false },
        archived: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, { schema: 'legal', tableName: 'sports_teams', underscored: true, timestamps: true });
