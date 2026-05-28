'use strict';

module.exports = (sequelize, DataTypes) => {
    const Order = sequelize.define('Order', {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        org_id: { type: DataTypes.UUID, allowNull: true },
        listing_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: { tableName: 'mineral_listings', schema: 'mining' }, key: 'id' },
        },
        rfq_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: { model: { tableName: 'rfqs', schema: 'mining' }, key: 'id' },
        },
        buyer_id: { type: DataTypes.INTEGER, allowNull: true },
        seller_id: { type: DataTypes.INTEGER, allowNull: true },
        quantity_mt: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
        unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
        total_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
        currency: { type: DataTypes.STRING(10), allowNull: true },
        status: {
            type: DataTypes.STRING(30),
            defaultValue: 'pending',
            validate: { isIn: [['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled', 'disputed']] },
        },
        payment_status: {
            type: DataTypes.STRING(20),
            defaultValue: 'unpaid',
            validate: { isIn: [['unpaid', 'partial', 'paid']] },
        },
        delivery_port: { type: DataTypes.STRING(200), allowNull: true },
        incoterm: { type: DataTypes.STRING(20), allowNull: true },
        contract_url: { type: DataTypes.STRING(500), allowNull: true },
    }, {
        tableName: 'orders',
        schema: 'mining',
        underscored: true,
        timestamps: true,
    });

    Order.associate = (models) => {
        Order.belongsTo(models.MineralListing, { foreignKey: 'listing_id', as: 'listing' });
        Order.belongsTo(models.Rfq, { foreignKey: 'rfq_id', as: 'rfq' });
        Order.hasMany(models.LogisticsShipment, { foreignKey: 'order_id', as: 'shipments' });
        Order.hasOne(models.LogisticsShipment, { foreignKey: 'order_id', as: 'shipment' });
        Order.hasMany(models.Dispute, { foreignKey: 'order_id', as: 'disputes' });
        Order.hasMany(models.TradeDocument, { foreignKey: 'order_id', as: 'tradeDocuments' });
    };

    return Order;
};
