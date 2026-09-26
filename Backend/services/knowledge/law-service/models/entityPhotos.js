'use strict';
module.exports = (sequelize, DataTypes) =>
    sequelize.define('EntityPhoto', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        entity_type: { type: DataTypes.STRING(30), allowNull: false },
        entity_slug: { type: DataTypes.STRING(200), allowNull: false },
        content_type: { type: DataTypes.STRING(40), allowNull: false },
        data: { type: DataTypes.BLOB, allowNull: false },
        width: DataTypes.INTEGER,
        height: DataTypes.INTEGER,
        sha256: { type: DataTypes.STRING(64), allowNull: false },
        alt_text: DataTypes.STRING(300),
        credit: { type: DataTypes.STRING(500), allowNull: false },
        license: { type: DataTypes.STRING(60), allowNull: false },
        license_url: DataTypes.STRING(500),
        source_url: DataTypes.STRING(500),
        is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, {
        schema: 'legal', tableName: 'entity_photos', underscored: true, timestamps: true, updatedAt: false,
        // Listings never carry the image bytes; scope('withData') is for the routes that serve them.
        defaultScope: { attributes: { exclude: ['data'] } },
        scopes: { withData: {} },
    });
