'use strict';
const { Sequelize } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config        = require('../config/appConfig');
const logger        = require('../utils/logger');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host:    config.db.host,
    port:    config.db.port,
    dialect: 'postgres',
    dialectOptions: { ssl: buildPgSsl() },
    logging: (msg) => logger.debug({ sql: msg }, 'SQL'),
    pool:    { max: 10, min: 2, acquire: 30000, idle: 10000 },
    define:  { underscored: true, timestamps: true },
});

module.exports = { sequelize, Sequelize };
