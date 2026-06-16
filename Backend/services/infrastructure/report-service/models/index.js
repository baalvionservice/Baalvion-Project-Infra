'use strict';
const { Sequelize, DataTypes } = require('sequelize');
const { buildPgSsl } = require('@baalvion/auth-node');
const config = require('../config/appConfig');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.password, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'postgres',
    dialectOptions: { ssl: buildPgSsl() },
    logging: false,
    define: { underscored: true, schema: config.db.schema },
});

const db = { sequelize, Sequelize };
db.ReportDefinition = require('./reportDefinition')(sequelize, DataTypes);
db.ReportRun        = require('./reportRun')(sequelize, DataTypes);
db.ReportSchedule   = require('./reportSchedule')(sequelize, DataTypes);

db.ReportDefinition.hasMany(db.ReportRun,      { foreignKey: 'definition_id', as: 'runs' });
db.ReportRun.belongsTo(db.ReportDefinition,    { foreignKey: 'definition_id', as: 'definition' });
db.ReportDefinition.hasMany(db.ReportSchedule, { foreignKey: 'definition_id', as: 'schedules' });
db.ReportSchedule.belongsTo(db.ReportDefinition, { foreignKey: 'definition_id', as: 'definition' });

module.exports = db;
