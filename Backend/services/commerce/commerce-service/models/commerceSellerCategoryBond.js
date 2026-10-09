'use strict';
// A non-refundable platform payment that entitles one seller to list in ONE root category.
// A second category needs a second payment. Status flow:
//   awaiting_payment -> payment_submitted -> active
// with rejected (payment not found) and forfeited (revoked for a violation) as terminal exits.
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('commerce_seller_category_bonds', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        sellerUserId: { type: DataTypes.BIGINT, allowNull: false },
        // 'category' = a seller's $2,000 category payment; 'buyer_access' = a buyer's entry pass (no category).
        kind: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'category' },
        categoryId: { type: DataTypes.UUID, allowNull: true },
        amountUsd: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
        currency: { type: DataTypes.STRING(10), allowNull: false },
        status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'awaiting_payment' },
        txHash: { type: DataTypes.STRING(200), allowNull: true },
        amountReceived: { type: DataTypes.STRING(60), allowNull: true },
        confirmedBy: { type: DataTypes.BIGINT, allowNull: true },
        confirmedAt: { type: DataTypes.DATE, allowNull: true },
        closedAt: { type: DataTypes.DATE, allowNull: true },
        payToAddress: { type: DataTypes.STRING(200), allowNull: true },
        payToNetwork: { type: DataTypes.STRING(30), allowNull: true },
        payToLabel: { type: DataTypes.STRING(80), allowNull: true },
        note: { type: DataTypes.TEXT, allowNull: true },
    }, {
        schema: 'commerce',
        tableName: 'commerce_seller_category_bonds',
        underscored: true,
        timestamps: true,
        indexes: [{ fields: ['seller_user_id'] }, { fields: ['status'] }],
    });
};
