'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commerce_product_reviews', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        productId: { type: DataTypes.UUID, allowNull: false, references: { model: { tableName: 'commerce_products', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
        storeId: { type: DataTypes.UUID, allowNull: false },
        customerId: { type: DataTypes.UUID, allowNull: false },
        rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
        title: { type: DataTypes.STRING(200), allowNull: true },
        body: { type: DataTypes.TEXT, allowNull: true },
        status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
        isVerifiedPurchase: { type: DataTypes.BOOLEAN, defaultValue: false },
        helpfulCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        reply: { type: DataTypes.TEXT, allowNull: true },
        replyAt: { type: DataTypes.DATE, allowNull: true },
    }, { schema: 'commerce', tableName: 'commerce_product_reviews', underscored: true, timestamps: true, indexes: [{ fields: ['product_id'] }, { fields: ['store_id'] }, { fields: ['status'] }] });
};
