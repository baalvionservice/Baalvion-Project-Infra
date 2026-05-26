'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('property_documents', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        property_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: { tableName: 'properties', schema: 'real_estate' }, key: 'id' } },
        org_id: { type: DataTypes.UUID, allowNull: true },
        type: { type: DataTypes.STRING(50), allowNull: true },
        name: { type: DataTypes.STRING(300), allowNull: true },
        url: { type: DataTypes.STRING(500), allowNull: true },
        uploaded_by: { type: DataTypes.INTEGER, allowNull: true },
    }, {
        tableName: 'property_documents',
        schema: 'real_estate',
        timestamps: true,
        underscored: true,
        updatedAt: false,
        indexes: [
            { fields: ['property_id'] },
            { fields: ['org_id'] },
        ],
    });
};
