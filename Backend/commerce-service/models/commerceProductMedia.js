'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commerce_product_media', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        productId: { type: DataTypes.UUID, allowNull: false, references: { model: { tableName: 'commerce_products', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
        variantId: { type: DataTypes.UUID, allowNull: true },
        mediaType: { type: DataTypes.ENUM('image', 'video', 'document'), defaultValue: 'image' },
        url: { type: DataTypes.TEXT, allowNull: false },
        thumbnailUrl: { type: DataTypes.TEXT, allowNull: true },
        altText: { type: DataTypes.STRING(500), allowNull: true },
        sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
        isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
    }, { schema: 'commerce', tableName: 'commerce_product_media', underscored: true, timestamps: true, indexes: [{ fields: ['product_id'] }, { fields: ['variant_id'] }] });
};
