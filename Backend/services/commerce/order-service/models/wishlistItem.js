'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('WishlistItem', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        wishlistId: { type: DataTypes.UUID, allowNull: false },
        productId: { type: DataTypes.UUID, allowNull: false },
        variantId: { type: DataTypes.UUID, allowNull: true },
        addedAt: { type: DataTypes.DATE, allowNull: true },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'wishlist_items' });
};
