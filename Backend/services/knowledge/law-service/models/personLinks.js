'use strict';
module.exports = (sequelize, DataTypes) =>
    sequelize.define('PersonLink', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        person_id: { type: DataTypes.INTEGER, allowNull: false },
        kind: { type: DataTypes.STRING(30), allowNull: false },
        target_slug: { type: DataTypes.STRING(200), allowNull: false },
        relationship: DataTypes.STRING(200),
    }, { schema: 'legal', tableName: 'person_links', underscored: true, timestamps: true, updatedAt: false });
