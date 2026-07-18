'use strict';
module.exports = function (sequelize, DataTypes) {
    return sequelize.define('CartEvent', {
        id: { type: DataTypes.UUID, primaryKey: true },
        cartId: { type: DataTypes.UUID, allowNull: false },
        storeId: { type: DataTypes.UUID, allowNull: false },
        userId: { type: DataTypes.BIGINT, allowNull: true },
        sessionIdHash: { type: DataTypes.STRING(64), allowNull: true },
        eventType: {
            type: DataTypes.ENUM('item_added', 'item_updated', 'item_removed', 'cart_cleared', 'cart_claimed'),
            allowNull: false,
        },
        itemSnapshot: { type: DataTypes.JSONB, allowNull: true },
        cartSnapshot: { type: DataTypes.JSONB, allowNull: false },
        occurredAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, {
        schema: 'orders', underscored: true, timestamps: false, tableName: 'cart_events',
    });
};
