'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host, port: config.db.port, dialect: 'postgres', dialectOptions: { ssl: buildPgSsl() },
    logging: config.env === 'development' ? (sql) => console.log('[Fulfillment DB]', sql) : false,
    define: { schema: config.db.schema, underscored: true, timestamps: true },
    pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
});

const FulfillmentCourier       = require('./fulfillmentCourier')(sequelize, DataTypes);
const FulfillmentShippingZone  = require('./fulfillmentShippingZone')(sequelize, DataTypes);
const FulfillmentShippingRate  = require('./fulfillmentShippingRate')(sequelize, DataTypes);
const FulfillmentShipment      = require('./fulfillmentShipment')(sequelize, DataTypes);
const FulfillmentTrackingEvent = require('./fulfillmentTrackingEvent')(sequelize, DataTypes);

FulfillmentShippingZone.hasMany(FulfillmentShippingRate, { foreignKey: 'zoneId', as: 'rates' });
FulfillmentShippingRate.belongsTo(FulfillmentShippingZone, { foreignKey: 'zoneId', as: 'zone' });

FulfillmentCourier.hasMany(FulfillmentShipment, { foreignKey: 'courierId', as: 'shipments' });
FulfillmentShipment.belongsTo(FulfillmentCourier, { foreignKey: 'courierId', as: 'courier' });

FulfillmentShipment.hasMany(FulfillmentTrackingEvent, { foreignKey: 'shipmentId', as: 'events' });
FulfillmentTrackingEvent.belongsTo(FulfillmentShipment, { foreignKey: 'shipmentId', as: 'shipment' });

const db = {
    sequelize, Sequelize, Op: Sequelize.Op,
    connectDB: async () => { await sequelize.authenticate(); console.log('[Fulfillment Service] Database connection established'); },
    FulfillmentCourier, FulfillmentShippingZone, FulfillmentShippingRate, FulfillmentShipment, FulfillmentTrackingEvent,
};

module.exports = db;
