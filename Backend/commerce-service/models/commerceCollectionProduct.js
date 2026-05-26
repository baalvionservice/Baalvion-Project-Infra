'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commerce_collection_products', {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
        collectionId: { type: DataTypes.UUID, allowNull: false, references: { model: { tableName: 'commerce_collections', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
        productId: { type: DataTypes.UUID, allowNull: false, references: { model: { tableName: 'commerce_products', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
        sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    }, { schema: 'commerce', tableName: 'commerce_collection_products', underscored: true, timestamps: false, indexes: [{ unique: true, fields: ['collection_id', 'product_id'] }] });
};
