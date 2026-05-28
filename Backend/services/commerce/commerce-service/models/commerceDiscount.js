'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commerce_discounts', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        storeId: { type: DataTypes.UUID, allowNull: false, references: { model: { tableName: 'commerce_stores', schema: 'commerce' }, key: 'id' }, onDelete: 'CASCADE' },
        code: { type: DataTypes.STRING(100), allowNull: false },
        name: { type: DataTypes.STRING(200), allowNull: false },
        type: { type: DataTypes.ENUM('percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y'), allowNull: false },
        value: { type: DataTypes.DECIMAL(15, 4), allowNull: false },
        minPurchaseAmount: { type: DataTypes.DECIMAL(15, 4), allowNull: true },
        maxDiscountAmount: { type: DataTypes.DECIMAL(15, 4), allowNull: true },
        usageLimit: { type: DataTypes.INTEGER, allowNull: true },
        usageCount: { type: DataTypes.INTEGER, defaultValue: 0 },
        appliesTo: { type: DataTypes.ENUM('all', 'specific_products', 'specific_categories', 'specific_collections'), defaultValue: 'all' },
        targetIds: { type: DataTypes.ARRAY(DataTypes.UUID), defaultValue: [] },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
        startsAt: { type: DataTypes.DATE, allowNull: true },
        endsAt: { type: DataTypes.DATE, allowNull: true },
    }, { schema: 'commerce', tableName: 'commerce_discounts', underscored: true, timestamps: true, indexes: [{ unique: true, fields: ['store_id', 'code'] }, { fields: ['store_id'] }, { fields: ['is_active'] }] });
};
