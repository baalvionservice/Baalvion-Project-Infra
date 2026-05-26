'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('favorites', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        property_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: { tableName: 'properties', schema: 'real_estate' }, key: 'id' } },
    }, {
        tableName: 'favorites',
        schema: 'real_estate',
        timestamps: true,
        underscored: true,
        updatedAt: false,
        indexes: [
            { unique: true, fields: ['user_id', 'property_id'] },
            { fields: ['user_id'] },
            { fields: ['property_id'] },
        ],
    });
};
