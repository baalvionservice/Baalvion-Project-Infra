const { Sequelize } = require('sequelize');
const config = require('../config/appConfig');

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.dialect,
    schema: config.db.schema,
    logging: config.db.logging,
    pool: config.db.pool,
  }
);

const db = {
  sequelize,
  Sequelize,
  JournalEntry: require('./JournalEntry')(sequelize),
};

module.exports = db;
