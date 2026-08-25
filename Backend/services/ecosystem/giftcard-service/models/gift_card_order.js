'use strict';
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('GiftCardOrder', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    user_id: { type: DataTypes.UUID, allowNull: false },
    brand_id: { type: DataTypes.UUID, allowNull: false },
    supplier: { type: DataTypes.STRING(40), allowNull: false },
    denomination_value: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    currency_code: { type: DataTypes.STRING(3), allowNull: false },
    // What the buyer actually paid in USD cents via the crypto gateway — may differ from
    // denomination_value*100 if priced with a margin; kept separate from the face value.
    price_usd_cents: { type: DataTypes.INTEGER, allowNull: false },
    status: {
        type: DataTypes.ENUM('pending_payment', 'paid', 'fulfilling', 'fulfilled', 'failed', 'refunded'),
        allowNull: false,
        defaultValue: 'pending_payment',
    },
    payment_method: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'CRYPTO' },
    wallet_hold_id: { type: DataTypes.UUID, allowNull: true },
    payment_ref: { type: DataTypes.STRING(160), allowNull: true },
    supplier_transaction_id: { type: DataTypes.STRING(160), allowNull: true },
    // Encrypted at rest via service/codeVault.js — never stored or logged in plaintext.
    redeem_code_encrypted: { type: DataTypes.TEXT, allowNull: true },
    redeem_pin_encrypted: { type: DataTypes.TEXT, allowNull: true },
    fulfillment_error: { type: DataTypes.TEXT, allowNull: true },
    fulfilled_at: { type: DataTypes.DATE, allowNull: true },
}, {
    tableName: 'gift_card_orders',
    schema: 'giftcard',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['user_id'] }, { fields: ['status'] }],
});
