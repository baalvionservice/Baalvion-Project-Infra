'use strict';
const { Sequelize } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    dialectOptions: { ssl: buildPgSsl() },
    logging: config.env === 'development' ? console.log : false,
    define: { underscored: true, timestamps: true },
});

const db = { sequelize, Sequelize };

db.GiftCardBrand = require('./gift_card_brand')(sequelize);
db.GiftCardOrder = require('./gift_card_order')(sequelize);
db.GiftCardBillingWebhookEvent = require('./gift_card_billing_webhook_event')(sequelize);

db.GiftCardBrand.hasMany(db.GiftCardOrder, { foreignKey: 'brand_id', as: 'orders' });
db.GiftCardOrder.belongsTo(db.GiftCardBrand, { foreignKey: 'brand_id', as: 'brand' });

module.exports = db;
