'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ItemOwnershipRecord', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        storeId: { type: DataTypes.UUID, allowNull: false },
        consignmentItemId: { type: DataTypes.UUID, allowNull: false },
        eventType: {
            type: DataTypes.ENUM('prior_ownership', 'consignor_submission', 'platform_custody', 'sold', 'returned'),
            allowNull: false,
        },
        ownerLabel: { type: DataTypes.STRING(200), allowNull: true },
        eventDate: { type: DataTypes.DATE, allowNull: true },
        location: { type: DataTypes.STRING(200), allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
        recordedBy: { type: DataTypes.BIGINT, allowNull: true },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'consignment_ownership_records' });
};
