'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('property_images', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        property_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: { tableName: 'properties', schema: 'real_estate' }, key: 'id' } },
        url: { type: DataTypes.STRING(500), allowNull: false },
        caption: { type: DataTypes.STRING(300), allowNull: true },
        is_cover: { type: DataTypes.BOOLEAN, defaultValue: false },
        display_order: { type: DataTypes.INTEGER, defaultValue: 0 },
    }, {
        tableName: 'property_images',
        schema: 'real_estate',
        timestamps: true,
        underscored: true,
        updatedAt: false,
        indexes: [
            { fields: ['property_id'] },
            { fields: ['is_cover'] },
        ],
    });
};
