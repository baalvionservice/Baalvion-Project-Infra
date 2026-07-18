'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('GiftCardBrand', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    supplier: { type: DataTypes.STRING(40), allowNull: false },
    supplier_product_id: { type: DataTypes.STRING(80), allowNull: false },
    name: { type: DataTypes.STRING(160), allowNull: false },
    slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
    country_code: { type: DataTypes.STRING(2), allowNull: false },
    currency_code: { type: DataTypes.STRING(3), allowNull: false },
    denomination_type: { type: DataTypes.ENUM('FIXED', 'RANGE'), allowNull: false },
    fixed_denominations: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
    min_denomination: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    max_denomination: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
    logo_url: { type: DataTypes.TEXT, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    redeem_instruction: { type: DataTypes.TEXT, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    last_synced_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'gift_card_brands',
    schema: 'giftcard',
    underscored: true,
    timestamps: true,
    indexes: [
        { unique: true, fields: ['supplier', 'supplier_product_id'] },
        { fields: ['country_code'] },
    ],
});
