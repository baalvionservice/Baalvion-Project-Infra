'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: config.env === 'development' ? (sql) => console.log('[Order DB]', sql) : false,
    define: { schema: config.db.schema, underscored: true, timestamps: true },
    pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
});

const OrdersCustomer     = require('./ordersCustomer')(sequelize, DataTypes);
const OrdersAddress      = require('./ordersAddress')(sequelize, DataTypes);
const OrdersCart         = require('./ordersCart')(sequelize, DataTypes);
const OrdersOrder        = require('./ordersOrder')(sequelize, DataTypes);
const OrdersOrderItem    = require('./ordersOrderItem')(sequelize, DataTypes);
const OrdersOrderPayment = require('./ordersOrderPayment')(sequelize, DataTypes);
const OrdersReturn       = require('./ordersReturn')(sequelize, DataTypes);
const OrdersReturnItem   = require('./ordersReturnItem')(sequelize, DataTypes);
const OrdersInvoice      = require('./ordersInvoice')(sequelize, DataTypes);
const OrdersShipment     = require('./ordersShipment')(sequelize, DataTypes);

// Associations
OrdersCustomer.hasMany(OrdersAddress, { foreignKey: 'customerId', as: 'addresses' });
OrdersAddress.belongsTo(OrdersCustomer, { foreignKey: 'customerId', as: 'customer' });

OrdersCustomer.hasMany(OrdersOrder, { foreignKey: 'customerId', as: 'orders' });
OrdersOrder.belongsTo(OrdersCustomer, { foreignKey: 'customerId', as: 'customer' });

OrdersOrder.hasMany(OrdersOrderItem, { foreignKey: 'orderId', as: 'items' });
OrdersOrderItem.belongsTo(OrdersOrder, { foreignKey: 'orderId', as: 'order' });

OrdersOrder.hasMany(OrdersOrderPayment, { foreignKey: 'orderId', as: 'payments' });
OrdersOrderPayment.belongsTo(OrdersOrder, { foreignKey: 'orderId', as: 'order' });

OrdersOrder.hasOne(OrdersInvoice, { foreignKey: 'orderId', as: 'invoice' });
OrdersInvoice.belongsTo(OrdersOrder, { foreignKey: 'orderId', as: 'order' });

OrdersOrder.hasMany(OrdersReturn, { foreignKey: 'orderId', as: 'returns' });
OrdersReturn.belongsTo(OrdersOrder, { foreignKey: 'orderId', as: 'order' });

OrdersReturn.hasMany(OrdersReturnItem, { foreignKey: 'returnId', as: 'items' });
OrdersReturnItem.belongsTo(OrdersReturn, { foreignKey: 'returnId', as: 'return' });

OrdersOrder.hasMany(OrdersShipment, { foreignKey: 'orderId', as: 'shipments' });
OrdersShipment.belongsTo(OrdersOrder, { foreignKey: 'orderId', as: 'order' });

const db = {
    sequelize, Sequelize,
    Op: Sequelize.Op,
    connectDB: async () => { await sequelize.authenticate(); console.log('[Order Service] Database connection established'); },
    OrdersCustomer,
    OrdersAddress,
    OrdersCart,
    OrdersOrder,
    OrdersOrderItem,
    OrdersOrderPayment,
    OrdersReturn,
    OrdersReturnItem,
    OrdersInvoice,
    OrdersShipment,
};

module.exports = db;
