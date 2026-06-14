'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('OrdersOrder', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        storeId: { type: DataTypes.UUID, allowNull: false },
        customerId: { type: DataTypes.UUID, allowNull: true },
        billingAddressId: { type: DataTypes.UUID, allowNull: true },
        shippingAddressId: { type: DataTypes.UUID, allowNull: true },
        orderNumber: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        status: { type: DataTypes.ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'), defaultValue: 'pending' },
        fulfillmentStatus: { type: DataTypes.ENUM('unfulfilled', 'partial', 'fulfilled', 'returned'), defaultValue: 'unfulfilled' },
        paymentStatus: { type: DataTypes.ENUM('pending', 'authorized', 'paid', 'partially_paid', 'refunded', 'voided', 'failed'), defaultValue: 'pending' },
        currencyCode: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'USD' },
        // 5-market commerce context (us/uk/ae/in/sg). Nullable for legacy rows; populated on create.
        market: { type: DataTypes.STRING(2), allowNull: true },
        taxType: { type: DataTypes.STRING(20), allowNull: true },
        taxRate: { type: DataTypes.DECIMAL(7, 4), allowNull: true },
        taxInclusive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        subtotal: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
        discountAmount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
        shippingAmount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
        taxAmount: { type: DataTypes.DECIMAL(14, 2), defaultValue: 0 },
        totalAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
        discountCode: { type: DataTypes.STRING(100), allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        tags: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
        metadata: { type: DataTypes.JSONB, defaultValue: {} },
        shippingAddress: { type: DataTypes.JSONB, allowNull: true },
        billingAddress: { type: DataTypes.JSONB, allowNull: true },
        cancelledAt: { type: DataTypes.DATE, allowNull: true },
        cancelReason: { type: DataTypes.TEXT, allowNull: true },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'orders_orders' });
};
