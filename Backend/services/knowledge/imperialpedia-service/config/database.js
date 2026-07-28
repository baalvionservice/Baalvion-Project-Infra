const dotenv = require('dotenv');
dotenv.config();
// Same TLS helper the runtime app uses (buildPgSsl, respects DB_SSL_REJECT_UNAUTHORIZED) --
// see cms-service/news-service config/database.js for the confirmed-live failure this
// hardcoded rejectUnauthorized:true would hit if this migrate script is ever invoked.
const { buildPgSsl } = require('@baalvion/auth-node');

module.exports = {
    development: {
        username: process.env.DB_USER || 'baalvion',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'baalvion_db',
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        dialect: 'postgres',
        schema: 'imperialpedia',
        define: { underscored: true, timestamps: true },
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        dialect: 'postgres',
        schema: 'imperialpedia',
        logging: false,
        dialectOptions: {
            ssl: buildPgSsl(),
        },
        define: { underscored: true, timestamps: true },
    },
};
