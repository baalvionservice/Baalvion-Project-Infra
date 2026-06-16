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

db.User         = require('./users')(sequelize, Sequelize.DataTypes);
db.Category     = require('./categories')(sequelize, Sequelize.DataTypes);
db.Subcategory  = require('./subcategories')(sequelize, Sequelize.DataTypes);
db.Article      = require('./articles')(sequelize, Sequelize.DataTypes);
db.Lawyer       = require('./lawyers')(sequelize, Sequelize.DataTypes);
db.Client       = require('./clients')(sequelize, Sequelize.DataTypes);
db.Case         = require('./cases')(sequelize, Sequelize.DataTypes);
db.Booking      = require('./bookings')(sequelize, Sequelize.DataTypes);
db.Message      = require('./messages')(sequelize, Sequelize.DataTypes);
db.Document     = require('./documents')(sequelize, Sequelize.DataTypes);
db.Payment      = require('./payments')(sequelize, Sequelize.DataTypes);
db.Subscription = require('./subscriptions')(sequelize, Sequelize.DataTypes);
db.Review       = require('./reviews')(sequelize, Sequelize.DataTypes);
db.Notification = require('./notifications')(sequelize, Sequelize.DataTypes);
db.Referral     = require('./referrals')(sequelize, Sequelize.DataTypes);
db.AuditLog     = require('./auditLogs')(sequelize, Sequelize.DataTypes);
db.LawyerLedger = require('./lawyerLedger')(sequelize, Sequelize.DataTypes);
db.Payout       = require('./payouts')(sequelize, Sequelize.DataTypes);

Object.values(db).forEach(model => {
    if (model && model.associate) model.associate(db);
});

module.exports = db;
