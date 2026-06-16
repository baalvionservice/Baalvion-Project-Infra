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
db.Shareholder = require('./shareholders')(sequelize, Sequelize.DataTypes);
db.IrContact = require('./ir_contacts')(sequelize, Sequelize.DataTypes);
db.IrEvent = require('./ir_events')(sequelize, Sequelize.DataTypes);
db.IrNotification = require('./ir_notifications')(sequelize, Sequelize.DataTypes);
db.IrSubscription = require('./ir_subscriptions')(sequelize, Sequelize.DataTypes);
db.IrVote = require('./ir_votes')(sequelize, Sequelize.DataTypes);
db.IrSetting = require('./ir_settings')(sequelize, Sequelize.DataTypes);
db.IrAlert = require('./ir_alerts')(sequelize, Sequelize.DataTypes);
db.IrBoardMaterial = require('./ir_board_materials')(sequelize, Sequelize.DataTypes);
db.IrGeneratedReport = require('./ir_generated_reports')(sequelize, Sequelize.DataTypes);
db.IrPerformance = require('./ir_performance')(sequelize, Sequelize.DataTypes);
db.MarketSnapshot = require('./market_snapshot')(sequelize, Sequelize.DataTypes);
db.IrInvestorApplication = require('./ir_investor_applications')(sequelize, Sequelize.DataTypes);

// Associations (none required between IR models currently)
Object.values(db).forEach(model => {
    if (model.associate) model.associate(db);
});

module.exports = db;
