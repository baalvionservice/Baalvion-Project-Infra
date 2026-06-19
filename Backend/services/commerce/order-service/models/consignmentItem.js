'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('ConsignmentItem', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        consignmentRequestId: { type: DataTypes.UUID, allowNull: false },
        brand: { type: DataTypes.STRING(120), allowNull: false },
        model: { type: DataTypes.STRING(200), allowNull: true },
        category: { type: DataTypes.STRING(120), allowNull: true },
        color: { type: DataTypes.STRING(120), allowNull: true },
        material: { type: DataTypes.STRING(120), allowNull: true },
        conditionGrade: { type: DataTypes.ENUM('pristine', 'excellent', 'very_good', 'good', 'fair'), allowNull: true },
        askingPrice: { type: DataTypes.DECIMAL(15, 4), allowNull: true },
        currency: { type: DataTypes.STRING(3), allowNull: true },
        description: { type: DataTypes.TEXT, allowNull: true },
        // Array of image URLs (strings).
        photoUrls: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        // Array of accessory labels (e.g. dustbag, box, receipt).
        accessories: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
        serialNumber: { type: DataTypes.STRING(120), allowNull: true },
    }, { schema: 'orders', underscored: true, timestamps: true, tableName: 'consignment_items' });
};
