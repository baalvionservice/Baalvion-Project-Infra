'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('InventoryReservation', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        warehouseId: { type: DataTypes.UUID, allowNull: false },
        storeId: { type: DataTypes.UUID, allowNull: false },
        // The storefront passes `variantId`; this service keys stock on `sku` (unique per warehouse),
        // so the variant identifier is stored here as the SKU the lock holds against.
        sku: { type: DataTypes.STRING(200), allowNull: false },
        productId: { type: DataTypes.UUID, allowNull: true },
        variantId: { type: DataTypes.UUID, allowNull: true },
        quantity: { type: DataTypes.INTEGER, allowNull: false },
        // User refs are stored as STRING (matches the heterogeneous user identifiers the storefront sends).
        userId: { type: DataTypes.STRING(128), allowNull: true },
        status: { type: DataTypes.ENUM('active', 'released', 'confirmed', 'expired'), defaultValue: 'active' },
        orderId: { type: DataTypes.UUID, allowNull: true },
        expiresAt: { type: DataTypes.DATE, allowNull: false },
    }, { schema: 'inventory', underscored: true, timestamps: true, tableName: 'inventory_reservations' });
};
