require('dotenv').config();
module.exports = {
    development: { username: process.env.DB_USER || 'baalvion', password: process.env.DB_PASSWORD || null, database: process.env.DB_NAME || 'baalvion_db', host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT || 5432), dialect: 'postgres', schema: 'fulfillment' },
    production: { username: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 5432), dialect: 'postgres', schema: 'fulfillment', dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } },
};
