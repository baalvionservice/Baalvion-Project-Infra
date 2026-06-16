'use strict';
const { Sequelize } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    dialectOptions: { ssl: buildPgSsl() },
    logging: config.env === 'development' ? false : false,
    define: {
        underscored: true,
        freezeTableName: true,
    },
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.VipClient = require('./vipClient')(sequelize, Sequelize.DataTypes);
db.Segment = require('./segment')(sequelize, Sequelize.DataTypes);
db.Campaign = require('./campaign')(sequelize, Sequelize.DataTypes);
db.Vendor = require('./vendor')(sequelize, Sequelize.DataTypes);
db.Affiliate = require('./affiliate')(sequelize, Sequelize.DataTypes);
db.Appointment = require('./appointment')(sequelize, Sequelize.DataTypes);
db.SupportTicket = require('./supportTicket')(sequelize, Sequelize.DataTypes);

Object.values(db).forEach((model) => {
    if (model.associate) model.associate(db);
});

module.exports = db;
