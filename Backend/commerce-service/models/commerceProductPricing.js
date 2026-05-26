'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commerce_product_pricing', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        productId: { type: DataTypes.UUID, allowNull: false, references: { model: { tableName: 'commerce_products', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
        variantId: { type: DataTypes.UUID, allowNull: true, references: { model: { tableName: 'commerce_product_variants', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
        storeId: { type: DataTypes.UUID, allowNull: false, references: { model: { tableName: 'commerce_stores', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
        price: { type: DataTypes.DECIMAL(15, 4), allowNull: false },
        compareAtPrice: { type: DataTypes.DECIMAL(15, 4), allowNull: true },
        costPrice: { type: DataTypes.DECIMAL(15, 4), allowNull: true },
        currencyCode: { type: DataTypes.CHAR(3), allowNull: false },
        taxClass: { type: DataTypes.STRING(50), defaultValue: 'standard' },
        taxRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
        startsAt: { type: DataTypes.DATE, allowNull: true },
        endsAt: { type: DataTypes.DATE, allowNull: true },
    }, { schema: 'commerce', tableName: 'commerce_product_pricing', underscored: true, timestamps: true, indexes: [{ unique: true, fields: ['product_id', 'variant_id', 'store_id'] }, { fields: ['product_id'] }, { fields: ['store_id'] }] });
};
