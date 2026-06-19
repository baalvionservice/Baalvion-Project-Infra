'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ConsignmentSellerProfile', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        storeId: { type: DataTypes.UUID, allowNull: false },
        // The seller may be a guest (no platform account) — userId is nullable; profiles are then
        // keyed by (storeId,email) instead.
        userId: { type: DataTypes.BIGINT, allowNull: true },
        displayName: { type: DataTypes.STRING(200), allowNull: true },
        email: { type: DataTypes.STRING(254), allowNull: false },
        phone: { type: DataTypes.STRING(30), allowNull: true },
        payoutMethod: { type: DataTypes.STRING(50), allowNull: true },
        payoutDetails: { type: DataTypes.JSONB, allowNull: true },
        status: { type: DataTypes.ENUM('active', 'suspended'), defaultValue: 'active' },
        totalConsignments: { type: DataTypes.INTEGER, defaultValue: 0 },
        totalPaidOut: { type: DataTypes.DECIMAL(15, 4), defaultValue: 0 },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'consignment_seller_profiles' });
};
