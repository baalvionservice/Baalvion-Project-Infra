'use strict';
const { Sequelize, DataTypes } = require('sequelize');
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

db.Source = require('./source')(sequelize, DataTypes);
db.Article = require('./article')(sequelize, DataTypes);

db.Source.hasMany(db.Article, { foreignKey: 'source_id', as: 'articles' });
db.Article.belongsTo(db.Source, { foreignKey: 'source_id', as: 'source' });

module.exports = db;
