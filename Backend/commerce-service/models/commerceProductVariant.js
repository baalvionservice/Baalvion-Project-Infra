'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commerce_product_variants', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        productId: { type: DataTypes.UUID, allowNull: false, references: { model: { tableName: 'commerce_products', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
        sku: { type: DataTypes.STRING(200), allowNull: false, unique: true },
        barcode: { type: DataTypes.STRING(100), allowNull: true },
        name: { type: DataTypes.STRING(200), allowNull: true },
        attributeValues: { type: DataTypes.JSONB, defaultValue: [] },
        price: { type: DataTypes.DECIMAL(15, 4), allowNull: false, defaultValue: 0 },
        compareAtPrice: { type: DataTypes.DECIMAL(15, 4), allowNull: true },
        costPrice: { type: DataTypes.DECIMAL(15, 4), allowNull: true },
        currencyCode: { type: DataTypes.CHAR(3), defaultValue: 'USD' },
        weight: { type: DataTypes.DECIMAL(10, 3), allowNull: true },
        dimensions: { type: DataTypes.JSONB, allowNull: true },
        isDefault: { type: DataTypes.BOOLEAN, defaultValue: false },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
        requiresShipping: { type: DataTypes.BOOLEAN, defaultValue: true },
        sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
    }, { schema: 'commerce', tableName: 'commerce_product_variants', underscored: true, timestamps: true, indexes: [{ fields: ['product_id'] }, { unique: true, fields: ['sku'] }] });
};
