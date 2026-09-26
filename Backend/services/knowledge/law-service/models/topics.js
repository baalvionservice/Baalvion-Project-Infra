'use strict';
module.exports = (sequelize, DataTypes) =>
    sequelize.define('Topic', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        slug: { type: DataTypes.STRING(200), allowNull: false, unique: true },
        name: { type: DataTypes.STRING(200), allowNull: false },
        pillar: { type: DataTypes.STRING(20), defaultValue: 'general' },
        aliases: { type: DataTypes.JSONB, defaultValue: [] },
        description: { type: DataTypes.TEXT, defaultValue: '' },
        published: { type: DataTypes.BOOLEAN, defaultValue: false },
        indexable: { type: DataTypes.BOOLEAN, defaultValue: false },
        archived: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, { schema: 'legal', tableName: 'topics', underscored: true, timestamps: true });
