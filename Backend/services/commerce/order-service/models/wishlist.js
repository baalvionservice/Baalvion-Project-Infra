'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('Wishlist', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        storeId: { type: DataTypes.UUID, allowNull: false },
        userId: { type: DataTypes.BIGINT, allowNull: false },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'wishlists' });
};
