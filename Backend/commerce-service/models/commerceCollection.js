'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commerce_collections', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        storeId: { type: DataTypes.UUID, allowNull: false, references: { model: { tableName: 'commerce_stores', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
        name: { type: DataTypes.STRING(200), allowNull: false },
        slug: { type: DataTypes.STRING(200), allowNull: false },
        description: { type: DataTypes.TEXT, allowNull: true },
        imageUrl: { type: DataTypes.TEXT, allowNull: true },
        seoMetadata: { type: DataTypes.JSONB, defaultValue: {} },
        isAutomated: { type: DataTypes.BOOLEAN, defaultValue: false },
        automationRules: { type: DataTypes.JSONB, defaultValue: {} },
        sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
        productCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    }, { schema: 'commerce', tableName: 'commerce_collections', underscored: true, timestamps: true, indexes: [{ unique: true, fields: ['store_id', 'slug'] }, { fields: ['store_id'] }] });
};
