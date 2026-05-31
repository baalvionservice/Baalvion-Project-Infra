'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: false,
    define: { underscored: true, schema: config.db.schema },
});

const db = { sequelize, Sequelize };
db.ApiKey          = require('./apiKey')(sequelize, DataTypes);
db.WebhookEndpoint = require('./webhookEndpoint')(sequelize, DataTypes);
db.WebhookDelivery = require('./webhookDelivery')(sequelize, DataTypes);
db.ApiSpec         = require('./apiSpec')(sequelize, DataTypes);
db.EventType       = require('./eventType')(sequelize, DataTypes);

db.WebhookEndpoint.hasMany(db.WebhookDelivery, { foreignKey: 'endpoint_id', as: 'deliveries' });
db.WebhookDelivery.belongsTo(db.WebhookEndpoint, { foreignKey: 'endpoint_id', as: 'endpoint' });

module.exports = db;
