'use strict';
const Sequelize = require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const fileConfig = require('../config/config');
const initModels = require('./init-models');

// Prefer environment variables (Docker/production) over config.json (Neon cloud)
const dbOptions = process.env.DB_HOST
    ? {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        database: process.env.DB_NAME || 'baalvion_db',
        username: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || '',
        dialect: 'postgres',
        dialectOptions: process.env.DB_SSL === 'false'
            ? {}
            : { ssl: { require: true, rejectUnauthorized: false } },
    }
    : fileConfig.development;

const db = {};
const sequelize = new Sequelize({
    ...dbOptions,
    define: { underscored: true, timestamps: true },
    logging: process.env.NODE_ENV === 'development' ? false : false,
});

const models = initModels(sequelize);
Object.assign(db, models);
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
