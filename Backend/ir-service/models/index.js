'use strict';
const { Sequelize } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: config.env === 'development' ? console.log : false,
    define: {
        underscored: true,
        freezeTableName: true,
    },
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Report = require('./reports')(sequelize, Sequelize.DataTypes);
db.Filing = require('./filings')(sequelize, Sequelize.DataTypes);
db.IrDocument = require('./ir_documents')(sequelize, Sequelize.DataTypes);
db.EarningsCall = require('./earnings_calls')(sequelize, Sequelize.DataTypes);
db.IrShareholder = require('./ir_shareholders')(sequelize, Sequelize.DataTypes);
db.IrContact = require('./ir_contacts')(sequelize, Sequelize.DataTypes);
db.IrEvent = require('./ir_events')(sequelize, Sequelize.DataTypes);

// Associations (none required between IR models currently)
Object.values(db).forEach(model => {
    if (model.associate) model.associate(db);
});

module.exports = db;
