'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    logging: false,
    define: { underscored: true, timestamps: false },
});

const db = { sequelize, Sequelize };
db.AuditEvent = require('./auditEvent')(sequelize, DataTypes);

module.exports = db;
