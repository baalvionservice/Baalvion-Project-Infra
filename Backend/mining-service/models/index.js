'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: config.env === 'development' ? console.log : false,
    define: { underscored: true, timestamps: true },
});

const db = { sequelize, Sequelize };

// Load models
db.MineralListing = require('./mineral_listings')(sequelize, DataTypes);
db.Rfq = require('./rfqs')(sequelize, DataTypes);
db.Bid = require('./bids')(sequelize, DataTypes);
db.Order = require('./orders')(sequelize, DataTypes);
db.LogisticsShipment = require('./logistics_shipments')(sequelize, DataTypes);
db.Warehouse = require('./warehouses')(sequelize, DataTypes);
db.Dispute = require('./disputes')(sequelize, DataTypes);
db.CompanyVerification = require('./company_verifications')(sequelize, DataTypes);
db.TradeDocument = require('./trade_documents')(sequelize, DataTypes);

// Run associations
Object.values(db).forEach((model) => {
    if (model && typeof model.associate === 'function') {
        model.associate(db);
    }
});

module.exports = db;
