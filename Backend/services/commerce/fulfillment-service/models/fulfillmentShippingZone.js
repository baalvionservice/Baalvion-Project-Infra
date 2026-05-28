'use strict';
module.exports = function(sequelize, DataTypes) {
    return sequelize.define('FulfillmentShippingZone', {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        storeId: { type: DataTypes.UUID, allowNull: false },
        name: { type: DataTypes.STRING(200), allowNull: false },
        countries: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
        regions: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
        isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    }, { schema: 'fulfillment', underscored: true, timestamps: true, tableName: 'fulfillment_shipping_zones' });
};
